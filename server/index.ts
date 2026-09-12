import express from "express";
import { createServer as createHttpServer } from "node:http";
import { createServer as createViteServer } from "vite";
import { Server as SocketIOServer } from "socket.io";
import { randomUUID } from "node:crypto";

import { getLanIPv4 } from "./lan.js";
import {
  addPlayer,
  closeRoom,
  createRoom,
  deleteRoomIfEmpty,
  getRoom,
  hasPlayerNamed,
  isRoomFull,
  markDisconnected,
  reconnectPlayer,
  sanitizeName,
  toPublicState,
} from "./roomStore.js";
import type {
  ControllerInputPayload,
  GameStartedPayload,
  RoomCreatedPayload,
  RoomClosedPayload,
  RoomJoinedPayload,
  ServerErrorPayload,
} from "../src/platform/types.js";
import { controllerForGame, gameLibrary, HIGH_FOREST_ID } from "./gameRegistry.js";
import {
  QUICK_DRAW_ID,
  cancelQuickDraw,
  handleQuickDrawInput,
  startQuickDraw,
} from "./games/quickDraw.js";
import {
  TRIVIA_RUSH_ID,
  cancelTriviaRush,
  handleTriviaInput,
  startTriviaRush,
} from "./games/triviaRush.js";
import {
  COLOR_CLASH_ID,
  cancelColorClash,
  handleColorClashDisconnect,
  handleColorClashInput,
  startColorClash,
} from "./games/colorClash.js";
import type { InternalRoom } from "./roomStore.js";

const PORT = Number(process.env.PORT ?? 5173);
const LAN_IP = getLanIPv4();

function startGame(
  io: SocketIOServer,
  room: InternalRoom,
  gameId: unknown
): ServerErrorPayload | null {
  if (room.phase === "playing") {
    return {
      code: "GAME_IN_PROGRESS",
      message: "Finish the current game before starting another one.",
    };
  }

  const id = typeof gameId === "string" ? gameId : "";
  const controller = controllerForGame[id];
  const game = gameLibrary.find((entry) => entry.id === id);
  if (!controller || !game) {
    return { code: "UNKNOWN_GAME", message: "That game doesn't exist." };
  }

  const connectedPlayers = room.players.filter((player) => player.connected).length;
  if (connectedPlayers < game.minPlayers) {
    return {
      code: "NOT_ENOUGH_PLAYERS",
      message: `${game.name} needs at least ${game.minPlayers} player${game.minPlayers === 1 ? "" : "s"}.`,
    };
  }
  if (connectedPlayers > game.maxPlayers) {
    return { code: "TOO_MANY_PLAYERS", message: `${game.name} supports up to ${game.maxPlayers} players.` };
  }

  room.phase = "playing";
  room.gameId = id;
  io.to(room.code).emit("game:started", { gameId: id, controller } satisfies GameStartedPayload);
  io.to(room.code).emit("room:state", toPublicState(room));

  if (id === QUICK_DRAW_ID) startQuickDraw(io, room);
  if (id === TRIVIA_RUSH_ID) startTriviaRush(io, room);
  if (id === COLOR_CLASH_ID) startColorClash(io, room);
  return null;
}

async function main() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new SocketIOServer(httpServer);

  // Public games are static files. Vite serves the file itself, while this
  // redirect makes the clean library URL resolve reliably in development.
  app.get("/games/high-forest/", (_request, response) => {
    response.redirect(302, "/games/high-forest/index.html");
  });

  // --- Socket.IO: rooms, players, connections ---------------------------
  // The server is authoritative for room membership and player identity.
  // Clients never invent their own player IDs or room state.
  io.on("connection", (socket) => {
    socket.on("room:create", () => {
      const room = createRoom(socket.id);
      socket.data.role = "host";
      socket.data.roomCode = room.code;
      socket.join(room.code);

      const controllerUrl = `http://${LAN_IP}:${PORT}/controller/?room=${room.code}`;
      const payload: RoomCreatedPayload = { code: room.code, controllerUrl };
      socket.emit("room:created", payload);
      socket.emit("room:state", toPublicState(room));
      socket.emit("game:library", gameLibrary);
    });

    socket.on(
      "room:join",
      (raw: { code?: string; name?: string } = {}) => {
        const code = typeof raw.code === "string" ? raw.code.toUpperCase() : "";
        const room = getRoom(code);
        if (!room) {
          const err: ServerErrorPayload = {
            code: "ROOM_NOT_FOUND",
            message: "That room code doesn't exist.",
          };
          socket.emit("connection:error", err);
          return;
        }

        const name = sanitizeName(raw.name);
        if (!name) {
          const err: ServerErrorPayload = {
            code: "INVALID_NAME",
            message: "Enter a name (1-20 characters).",
          };
          socket.emit("connection:error", err);
          return;
        }

        if (room.phase === "playing") {
          const err: ServerErrorPayload = {
            code: "GAME_IN_PROGRESS",
            message: "A game is in progress. Join when this round ends.",
          };
          socket.emit("connection:error", err);
          return;
        }

        if (isRoomFull(room)) {
          const err: ServerErrorPayload = {
            code: "ROOM_FULL",
            message: "Room is full.",
          };
          socket.emit("connection:error", err);
          return;
        }

        if (hasPlayerNamed(room, name)) {
          const err: ServerErrorPayload = {
            code: "DUPLICATE_NAME",
            message: "That name is already in this room. Choose another one.",
          };
          socket.emit("connection:error", err);
          return;
        }

        const playerId = randomUUID();
        addPlayer(room, playerId, name);

        socket.data.role = "controller";
        socket.data.roomCode = room.code;
        socket.data.playerId = playerId;
        socket.join(room.code);

        const payload: RoomJoinedPayload = { code: room.code, playerId };
        socket.emit("room:joined", payload);
        io.to(room.code).emit("room:state", toPublicState(room));
      }
    );

    // A phone that reloads or drops Wi-Fi briefly reconnects to its EXISTING
    // player identity (and score) instead of joining as a brand-new player.
    // The controller stores {code, playerId} in localStorage and tries this
    // before falling back to a normal room:join.
    socket.on(
      "player:reconnect",
      (raw: { code?: string; playerId?: string } = {}) => {
        const code = typeof raw.code === "string" ? raw.code.toUpperCase() : "";
        const room = getRoom(code);
        if (!room) {
          const err: ServerErrorPayload = {
            code: "ROOM_NOT_FOUND",
            message: "That room no longer exists.",
          };
          socket.emit("connection:error", err);
          return;
        }

        const playerId = typeof raw.playerId === "string" ? raw.playerId : "";
        if (!playerId || !reconnectPlayer(room, playerId)) {
          const err: ServerErrorPayload = {
            code: "PLAYER_NOT_FOUND",
            message: "Couldn't reconnect — please join again.",
          };
          socket.emit("connection:error", err);
          return;
        }

        socket.data.role = "controller";
        socket.data.roomCode = room.code;
        socket.data.playerId = playerId;
        socket.join(room.code);

        const payload: RoomJoinedPayload = { code: room.code, playerId };
        socket.emit("room:joined", payload);
        io.to(room.code).emit("room:state", toPublicState(room));

        // If a game is already running, replay its controller config so the
        // reconnecting phone shows the right buttons instead of the waiting screen.
        if (room.phase === "playing" && room.gameId) {
          const controller = controllerForGame[room.gameId];
          if (controller) {
            const startedPayload: GameStartedPayload = { gameId: room.gameId, controller };
            socket.emit("game:started", startedPayload);
          }
        }
      }
    );

    socket.on("room:start-game", (raw: { gameId?: string } = {}) => {
      const roomCode = socket.data.roomCode as string | undefined;
      if (socket.data.role !== "host" || !roomCode) return;
      const room = getRoom(roomCode);
      if (!room) return;

      const err = startGame(io, room, raw.gameId);
      if (err) socket.emit("connection:error", err);
    });

    socket.on("controller:input", (raw: ControllerInputPayload = { action: "" }) => {
      const roomCode = socket.data.roomCode as string | undefined;
      const playerId = socket.data.playerId as string | undefined;
      if (socket.data.role !== "controller" || !roomCode || !playerId) return;
      const room = getRoom(roomCode);
      if (!room || room.phase !== "playing" || !room.gameId) return;

      // Defense in depth: never trust the client's action string. Every game's
      // controller definition declares its valid buttons — reject anything else
      // before it reaches game-specific logic.
      if (typeof raw.action !== "string" || raw.action.length === 0) return;
      const controller = controllerForGame[room.gameId];
      if (!controller || !controller.buttons.includes(raw.action)) return;

      if (room.gameId === QUICK_DRAW_ID && raw.action === "tap") {
        handleQuickDrawInput(io, room, playerId);
      }
      if (room.gameId === TRIVIA_RUSH_ID) {
        handleTriviaInput(io, room, playerId, raw.action);
      }
      if (room.gameId === COLOR_CLASH_ID) {
        handleColorClashInput(io, room, playerId, raw.action);
      }
      if (room.gameId === HIGH_FOREST_ID && room.hostSocketId) {
        io.to(room.hostSocketId).emit("game:input", {
          playerId,
          action: raw.action,
          pressed: raw.pressed === true,
        });
      }
    });

    socket.on("room:return-to-library", () => {
      const roomCode = socket.data.roomCode as string | undefined;
      if (socket.data.role !== "host" || !roomCode) return;
      const room = getRoom(roomCode);
      if (!room) return;

      cancelQuickDraw(room.code);
      cancelTriviaRush(room.code);
      cancelColorClash(room.code);
      room.phase = "lobby";
      room.gameId = null;
      io.to(room.code).emit("room:state", toPublicState(room));
    });

    socket.on("room:play-again", () => {
      const roomCode = socket.data.roomCode as string | undefined;
      if (socket.data.role !== "host" || !roomCode) return;
      const room = getRoom(roomCode);
      if (!room || room.phase !== "results" || !room.gameId) return;

      const err = startGame(io, room, room.gameId);
      if (err) socket.emit("connection:error", err);
    });

    socket.on("room:reset-session", () => {
      const roomCode = socket.data.roomCode as string | undefined;
      if (socket.data.role !== "host" || !roomCode) return;
      const room = getRoom(roomCode);
      if (!room) return;
      if (room.phase === "playing") {
        socket.emit("connection:error", {
          code: "GAME_IN_PROGRESS",
          message: "Finish the current game before starting a new session.",
        } satisfies ServerErrorPayload);
        return;
      }

      cancelQuickDraw(room.code);
      cancelTriviaRush(room.code);
      cancelColorClash(room.code);
      room.players.forEach((player) => (player.score = 0));
      room.phase = "lobby";
      room.gameId = null;
      io.to(room.code).emit("room:state", toPublicState(room));
    });

    socket.on("disconnect", () => {
      const roomCode = socket.data.roomCode as string | undefined;
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room) return;

      if (socket.data.role === "host") {
        cancelQuickDraw(room.code);
        cancelTriviaRush(room.code);
        cancelColorClash(room.code);
        const payload: RoomClosedPayload = {
          message: "The host left the room. Start a new room to keep playing.",
        };
        io.to(room.code).emit("room:closed", payload);
        closeRoom(room);
        return;
      }

      const playerId = socket.data.playerId as string | undefined;
      if (!playerId) return;

      markDisconnected(room, playerId, () => {
        if (room.gameId === COLOR_CLASH_ID) handleColorClashDisconnect(io, room);
        io.to(room.code).emit("room:state", toPublicState(room));
        deleteRoomIfEmpty(room);
      });
      io.to(room.code).emit("room:state", toPublicState(room));
    });
  });

  // --- Vite (dev) in middleware mode, mounted on the same server/port ---
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "mpa",
  });
  app.use(vite.middlewares);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`\nStellar Play running:\n`);
    console.log(`  Host (this PC): http://localhost:${PORT}/tv/`);
    console.log(`  LAN (for phones): http://${LAN_IP}:${PORT}/controller/\n`);
    if (LAN_IP === "localhost") {
      console.log(
        "  Warning: no LAN network interface detected. Phones on other devices won't be able to reach this server."
      );
    }
  });
}

main();
