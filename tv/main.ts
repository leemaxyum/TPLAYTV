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
  ServerErrorPayload,
  TriviaStage,
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
const highForestFrame = document.getElementById("high-forest-frame") as HTMLIFrameElement;
const triviaViewEl = document.getElementById("trivia-view")!;
const triviaProgressEl = document.getElementById("trivia-progress")!;
const triviaPromptEl = document.getElementById("trivia-prompt")!;
const triviaOptionsEl = document.getElementById("trivia-options")!;
const resultsListEl = document.getElementById("results-list")!;
const libraryBtn = document.getElementById("library-btn")!;

const TRIVIA_RUSH_ID = "trivia-rush";
const HIGH_FOREST_ID = "high-forest-quest";

let library: GameLibraryEntry[] = [];
let activeGameId: string | null = null;

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

// ===========================================================================
// Boot screen — a deliberate, minimum-duration "console starting up" sequence.
// Progress is tied to real milestones (socket connect, room created) but a
// floor duration is enforced so it never feels instant/cheap even on a fast
// LAN. This is purely presentational and never blocks the actual socket
// logic below, which runs immediately in parallel.
// ===========================================================================

const bootScreen = document.getElementById("boot-screen")!;
const bootBar = document.getElementById("boot-progress-bar")!;
const bootLabel = document.getElementById("boot-label")!;
const appShell = document.getElementById("app-shell")!;

const BOOT_MIN_MS = 1600;
const bootStartedAt = performance.now();
let roomIsReady = false;

function setBootProgress(percent: number, label?: string) {
  bootBar.style.width = `${percent}%`;
  if (label) bootLabel.textContent = label;
}

function finishBootIfReady() {
  if (!roomIsReady) return;
  const elapsed = performance.now() - bootStartedAt;
  const remaining = Math.max(BOOT_MIN_MS - elapsed, 0);
  setBootProgress(100, "Ready");
  setTimeout(() => {
    bootScreen.classList.add("boot-hide");
    appShell.classList.add("shell-visible");
    setTimeout(() => bootScreen.remove(), 700);
  }, remaining);
}

setBootProgress(12, "Starting Stellar Play…");

// Safety net: never let the boot screen hang forever if something is slow
// (e.g. first-run dependency install still finishing) — reveal the app
// after a hard ceiling even if room:created hasn't arrived yet.
setTimeout(() => {
  if (!roomIsReady) {
    roomIsReady = true;
    finishBootIfReady();
  }
}, 8000);

// ===========================================================================
// Settings — a self-contained overlay + localStorage persistence. Deliberately
// independent of the game-phase view switching below (showOnly), so opening
// it can never interfere with room/game state.
// ===========================================================================

type Density = "comfortable" | "compact";
type ThemeId = "stellar-dark" | "wii-light" | "midnight";

type Settings = {
  theme: ThemeId;
  cursor: boolean;
  reducedMotion: boolean;
  density: Density;
};

const DEFAULT_SETTINGS: Settings = {
  theme: "stellar-dark",
  cursor: true,
  reducedMotion: false,
  density: "comfortable",
};

const SETTINGS_KEY = "stellarplay:tv-settings";

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage can fail (private browsing, quota); settings just won't persist.
  }
}

function applySettings(settings: Settings) {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.density = settings.density;
  document.documentElement.classList.toggle("no-custom-cursor", !settings.cursor);
  document.documentElement.classList.toggle("reduced-motion", settings.reducedMotion);

  document.querySelectorAll<HTMLButtonElement>("#theme-picker button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === settings.theme);
  });
  document.querySelectorAll<HTMLButtonElement>("#density-picker button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === settings.density);
  });
  (document.getElementById("cursor-toggle") as HTMLInputElement).checked = settings.cursor;
  (document.getElementById("motion-toggle") as HTMLInputElement).checked = settings.reducedMotion;
}

let settings = loadSettings();
applySettings(settings);

const settingsOverlay = document.getElementById("settings-overlay")!;

function openSettings() {
  settingsOverlay.classList.remove("hidden");
  settingsOverlay.setAttribute("aria-hidden", "false");
}

function closeSettings() {
  settingsOverlay.classList.add("hidden");
  settingsOverlay.setAttribute("aria-hidden", "true");
}

document.querySelectorAll<HTMLElement>("[data-close-settings]").forEach((el) => {
  el.addEventListener("click", closeSettings);
});

document.querySelectorAll<HTMLButtonElement>("#theme-picker button").forEach((btn) => {
  btn.addEventListener("click", () => {
    settings = { ...settings, theme: btn.dataset.value as ThemeId };
    saveSettings(settings);
    applySettings(settings);
  });
});

document.querySelectorAll<HTMLButtonElement>("#density-picker button").forEach((btn) => {
  btn.addEventListener("click", () => {
    settings = { ...settings, density: btn.dataset.value as Density };
    saveSettings(settings);
    applySettings(settings);
  });
});

document.getElementById("cursor-toggle")!.addEventListener("change", (e) => {
  settings = { ...settings, cursor: (e.target as HTMLInputElement).checked };
  saveSettings(settings);
  applySettings(settings);
});

document.getElementById("motion-toggle")!.addEventListener("change", (e) => {
  settings = { ...settings, reducedMotion: (e.target as HTMLInputElement).checked };
  saveSettings(settings);
  applySettings(settings);
});

// ===========================================================================
// Top nav — Home/Games/Players/Leaderboard scroll within the lobby (they're
// only meaningful while the lobby is on screen); Settings opens the overlay.
// ===========================================================================

document.querySelectorAll<HTMLButtonElement>(".nav-item[data-nav]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.nav!;

    if (target === "settings") {
      openSettings();
      return;
    }

    document.querySelectorAll<HTMLElement>(".nav-item[data-nav]").forEach((b) => {
      b.classList.toggle("active", b === btn);
    });

    if (target === "home") {
      document.getElementById("lobby-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (target === "games") {
      document.getElementById("games")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (target === "players") {
      document.getElementById("players")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ===========================================================================
// Socket wiring — unchanged from the working build (room/game logic only;
// no presentation changes here beyond the two boot-progress calls marked).
// ===========================================================================

socket.on("connect", () => {
  statusEl.textContent = "Connected. Creating room…";
  setBootProgress(55, "Connecting to host…"); // boot progress
  socket.emit("room:create");
});

socket.on("disconnect", () => {
  statusEl.textContent = "Disconnected from server. Reconnecting…";
});

socket.on("connection:error", (err: ServerErrorPayload) => {
  statusEl.textContent = err.message;
});

socket.on("room:created", async (payload: RoomCreatedPayload) => {
  statusEl.textContent = "Room ready. Waiting for players…";
  roomCodeEl.textContent = payload.code.split("").join(" ");
  joinUrlEl.textContent = payload.controllerUrl;
  await QRCode.toCanvas(qrCanvas, payload.controllerUrl, {
    width: 180,
    margin: 1,
  });
  roomIsReady = true; // boot progress
  finishBootIfReady(); // boot progress
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
  activeGameId = payload.gameId;
  gameTitleEl.textContent = game?.name ?? payload.gameId;

  const isHighForest = payload.gameId === HIGH_FOREST_ID;
  const isTrivia = payload.gameId === TRIVIA_RUSH_ID;

  highForestFrame.classList.toggle("hidden", !isHighForest);
  gameStageEl.classList.toggle("hidden", isHighForest || isTrivia);
  triviaViewEl.classList.toggle("hidden", !isTrivia);

  if (isHighForest) {
    gameStageEl.textContent = "";
    highForestFrame.src = "/games/high-forest/index.html";
  } else {
    highForestFrame.src = "";
    if (!isTrivia) gameStageEl.textContent = "Get ready…";
  }
  showOnly(gameViewSection);
});

socket.on("game:input", (input: { action: string; pressed: boolean }) => {
  if (activeGameId !== HIGH_FOREST_ID || !highForestFrame.contentWindow) return;
  highForestFrame.contentWindow.postMessage({ type: "remote-input", ...input }, window.location.origin);
});

socket.on("game:state", (state: QuickDrawStage | TriviaStage) => {
  if (state.stage === "ready") {
    gameStageEl.textContent = "READY…";
    gameStageEl.className = "game-stage ready";
  } else if (state.stage === "go") {
    gameStageEl.textContent = "GO!";
    gameStageEl.className = "game-stage go";
  } else if (state.stage === "question") {
    triviaProgressEl.textContent = `Question ${state.questionIndex + 1} / ${state.totalQuestions}`;
    triviaPromptEl.textContent = state.prompt;
    triviaOptionsEl.innerHTML = "";
    const labels = ["A", "B", "C", "D"];
    state.options.forEach((option, i) => {
      const div = document.createElement("div");
      div.className = "trivia-option";
      div.innerHTML = `<span class="trivia-option-label">${labels[i]}</span><span>${option}</span>`;
      triviaOptionsEl.appendChild(div);
    });
  } else if (state.stage === "reveal") {
    const options = triviaOptionsEl.querySelectorAll<HTMLDivElement>(".trivia-option");
    options.forEach((el, i) => {
      el.classList.toggle("correct", i === state.correctIndex);
    });
  }
});

socket.on("game:results", (payload: GameResultsPayload) => {
  resultsListEl.innerHTML = "";
  for (const r of payload.rankings) {
    const li = document.createElement("li");
    let detail: string;
    if ("reactionMs" in r) {
      detail = r.falseStart ? "false start" : r.reactionMs !== null ? `${r.reactionMs} ms` : "no tap";
    } else {
      detail = `${r.correctCount} correct — ${r.points} pts`;
    }
    li.textContent = `${r.name} — ${detail}`;
    resultsListEl.appendChild(li);
  }
  showOnly(resultsSection);
});

libraryBtn.addEventListener("click", () => {
  activeGameId = null;
  highForestFrame.src = "";
  socket.emit("room:return-to-library");
});
