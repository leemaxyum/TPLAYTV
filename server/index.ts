import express from "express";
import { createServer as createHttpServer } from "node:http";
import { createServer as createViteServer } from "vite";
import { Server as SocketIOServer } from "socket.io";
import { randomUUID } from "node:crypto";

import { getLanIPv4 } from "./lan.js";
import {
  addPlayer,
  createRoom,
  deleteRoomIfEmpty,
  getRoom,
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

const PORT = Number(process.env.PORT ?? 5173);
const LAN_IP = getLanIPv4();

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

        if (isRoomFull(room)) {
          const err: ServerErrorPayload = {
            code: "ROOM_FULL",
            message: "Room is full.",
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

    socket.on("room:start-game", (raw: { gameId?: string } = {}) => {
      const roomCode = socket.data.roomCode as string | undefined;
      if (socket.data.role !== "host" || !roomCode) return;
      const room = getRoom(roomCode);
      if (!room) return;

      const gameId = raw.gameId;
      const controller = gameId ? controllerForGame[gameId] : undefined;
      if (!gameId || !controller) {
        const err: ServerErrorPayload = {
          code: "UNKNOWN_GAME",
          message: "That game doesn't exist.",
        };
        socket.emit("connection:error", err);
        return;
      }

      room.phase = "playing";
      room.gameId = gameId;

      const payload: GameStartedPayload = { gameId, controller };
      io.to(room.code).emit("game:started", payload);
      io.to(room.code).emit("room:state", toPublicState(room));

      if (gameId === QUICK_DRAW_ID) {
        startQuickDraw(io, room);
      }
    });

    socket.on("controller:input", (raw: ControllerInputPayload = { action: "" }) => {
      const roomCode = socket.data.roomCode as string | undefined;
      const playerId = socket.data.playerId as string | undefined;
      if (socket.data.role !== "controller" || !roomCode || !playerId) return;
      const room = getRoom(roomCode);
      if (!room || room.phase !== "playing") return;

      if (room.gameId === QUICK_DRAW_ID && raw.action === "tap") {
        handleQuickDrawInput(io, room, playerId);
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
        room.hostSocketId = null;
        deleteRoomIfEmpty(room);
        return;
      }

      const playerId = socket.data.playerId as string | undefined;
      if (!playerId) return;

      markDisconnected(room, playerId, () => {
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
