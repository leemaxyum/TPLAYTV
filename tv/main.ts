import QRCode from "qrcode";
import { connectSocket } from "../src/network/client";
import type {
  GameLibraryEntry,
  GameResultsPayload,
  GameStartedPayload,
  PlayerState,
  QuickDrawStage,
  RoomCreatedPayload,
  RoomState,
} from "../src/platform/types";

const socket = connectSocket();

const statusEl = document.getElementById("status")!;
const roomCodeEl = document.getElementById("room-code")!;
const joinUrlEl = document.getElementById("join-url")!;
const qrCanvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
const playerListEl = document.getElementById("player-list")!;
const playerCountEl = document.getElementById("player-count")!;
const gameLibraryEl = document.getElementById("game-library")!;

const lobbySection = document.getElementById("lobby")!;
const gameViewSection = document.getElementById("game-view")!;
const resultsSection = document.getElementById("results-view")!;
const gameTitleEl = document.getElementById("game-title")!;
const gameStageEl = document.getElementById("game-stage")!;
const resultsListEl = document.getElementById("results-list")!;
const libraryBtn = document.getElementById("library-btn")!;

let library: GameLibraryEntry[] = [];

// Fixed palette so avatar colors stay stable across re-renders/sorts.
const AVATAR_COLORS = ["#0137f2", "#e63946", "#2ec4b6", "#fee500", "#ff6b35", "#8338ec", "#06d6a0", "#ef476f"];

function colorForPlayer(playerId: string): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialsFor(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

function showOnly(section: HTMLElement) {
  for (const el of [lobbySection, gameViewSection, resultsSection]) {
    el.classList.toggle("hidden", el !== section);
  }
}

socket.on("connect", () => {
  statusEl.textContent = "Connected. Creating room…";
  socket.emit("room:create");
});

socket.on("disconnect", () => {
  statusEl.textContent = "Disconnected from server. Reconnecting…";
});

socket.on("room:created", async (payload: RoomCreatedPayload) => {
  statusEl.textContent = "Room ready. Waiting for players…";
  roomCodeEl.textContent = payload.code.split("").join(" ");
  joinUrlEl.textContent = payload.controllerUrl;
  await QRCode.toCanvas(qrCanvas, payload.controllerUrl, {
    width: 180,
    margin: 1,
  });
});

socket.on("game:library", (games: GameLibraryEntry[]) => {
  library = games;

  // Remove any previously-inserted dynamic cards, keep the static "coming soon" ones.
  gameLibraryEl.querySelectorAll(".dynamic-game").forEach((el) => el.remove());

  const fragment = document.createDocumentFragment();
  for (const game of games) {
    const li = document.createElement("li");
    li.className = "game-card dynamic-game";
    li.innerHTML = `<span class="game-icon">⏱️</span><strong>${game.name}</strong><span class="game-desc">${game.description}</span>`;
    li.addEventListener("click", () => {
      socket.emit("room:start-game", { gameId: game.id });
    });
    fragment.appendChild(li);
  }
  gameLibraryEl.insertBefore(fragment, gameLibraryEl.firstElementChild);
});

socket.on("room:state", (room: RoomState) => {
  playerCountEl.textContent = `(${room.players.length})`;

  // Sorted by score desc — this list doubles as the live leaderboard.
  const sorted: PlayerState[] = [...room.players].sort((a, b) => b.score - a.score);

  playerListEl.innerHTML = "";
  for (const player of sorted) {
    const li = document.createElement("li");
    li.className = player.connected ? "connected" : "disconnected";

    const circle = document.createElement("div");
    circle.className = "avatar-circle";
    circle.style.background = colorForPlayer(player.id);
    circle.textContent = initialsFor(player.name);

    const name = document.createElement("div");
    name.className = "player-name";
    name.textContent = player.name;

    li.appendChild(circle);
    li.appendChild(name);

    if (player.score > 0) {
      const score = document.createElement("div");
      score.className = "player-score";
      score.textContent = `${player.score} pts`;
      li.appendChild(score);
    }

    playerListEl.appendChild(li);
  }

  if (room.phase === "lobby") showOnly(lobbySection);
});

socket.on("game:started", (payload: GameStartedPayload) => {
  const game = library.find((g) => g.id === payload.gameId);
  gameTitleEl.textContent = game?.name ?? payload.gameId;
  gameStageEl.textContent = "Get ready…";
  showOnly(gameViewSection);
});

socket.on("game:state", (state: QuickDrawStage) => {
  if (state.stage === "ready") {
    gameStageEl.textContent = "READY…";
    gameStageEl.className = "game-stage ready";
  } else if (state.stage === "go") {
    gameStageEl.textContent = "GO!";
    gameStageEl.className = "game-stage go";
  }
});

socket.on("game:results", (payload: GameResultsPayload) => {
  resultsListEl.innerHTML = "";
  for (const r of payload.rankings) {
    const li = document.createElement("li");
    const detail = r.falseStart
      ? "false start"
      : r.reactionMs !== null
      ? `${r.reactionMs} ms`
      : "no tap";
    li.textContent = `${r.name} — ${detail}`;
    resultsListEl.appendChild(li);
  }
  showOnly(resultsSection);
});

libraryBtn.addEventListener("click", () => {
  socket.emit("room:return-to-library");
});
