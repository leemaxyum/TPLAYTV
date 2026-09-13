import QRCode from "qrcode";
import { connectSocket } from "../src/network/client";
import { starterModules, type TeacherModule } from "./learningModules";
import type {
  ColorClashStage,
  FuseFrenzyStage,
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
const colorClashViewEl = document.getElementById("color-clash-view")!;
const colorClashProgressEl = document.getElementById("color-clash-progress")!;
const colorClashWordEl = document.getElementById("color-clash-word")!;
const colorClashRevealEl = document.getElementById("color-clash-reveal")!;
const resultsListEl = document.getElementById("results-list")!;
const replayBtn = document.getElementById("replay-btn")!;
const libraryBtn = document.getElementById("library-btn")!;
const resetSessionBtn = document.getElementById("reset-session-btn")!;
const studySection = document.getElementById("study-view")!;
const studyHome = document.getElementById("study-home")!;
const recreationRoom = document.getElementById("recreation-room")!;
const studyBoardEl = document.getElementById("study-board")!;
const studyTextEl = document.getElementById("study-text") as HTMLInputElement;
const studyLaneEl = document.getElementById("study-lane") as HTMLSelectElement;
const studyAddBtn = document.getElementById("study-add-btn")!;
const boosterImportEl = document.getElementById("booster-import") as HTMLTextAreaElement;
const boosterImportBtn = document.getElementById("booster-import-btn")!;
const boosterStartBtn = document.getElementById("booster-start-btn")!;
const boosterRevealBtn = document.getElementById("booster-reveal-btn")!;
const boosterNextBtn = document.getElementById("booster-next-btn")!;
const boosterStatusEl = document.getElementById("booster-status")!;
const boosterLiveEl = document.getElementById("booster-live")!;
const builderTitleEl = document.getElementById("builder-title-input") as HTMLInputElement;
const builderTopicEl = document.getElementById("builder-topic-input") as HTMLInputElement;
const builderPromptEl = document.getElementById("builder-prompt") as HTMLTextAreaElement;
const builderChoiceEls = Array.from(document.querySelectorAll<HTMLInputElement>("#builder-choices [data-choice]"));
const builderExplanationEl = document.getElementById("builder-explanation") as HTMLTextAreaElement;
const builderAddBtn = document.getElementById("builder-add-btn")!;
const builderLoadBtn = document.getElementById("builder-load-btn")!;
const builderClearBtn = document.getElementById("builder-clear-btn")!;
const builderStatusEl = document.getElementById("builder-status")!;
const builderDraftEl = document.getElementById("builder-draft")!;
const starterModulesEl = document.getElementById("starter-modules")!;
const savedModulesEl = document.getElementById("saved-modules")!;
const activeModuleEl = document.getElementById("active-module")!;
const moduleTitleEl = document.getElementById("module-title-input") as HTMLInputElement;
const moduleTopicEl = document.getElementById("module-topic-input") as HTMLInputElement;
const moduleDescriptionEl = document.getElementById("module-description-input") as HTMLTextAreaElement;
const lessonTitleEl = document.getElementById("lesson-title-input") as HTMLInputElement;
const lessonTheoryEl = document.getElementById("lesson-theory-input") as HTMLTextAreaElement;
const lessonPracticeEl = document.getElementById("lesson-practice-input") as HTMLTextAreaElement;
const lessonSolutionEl = document.getElementById("lesson-solution-input") as HTMLTextAreaElement;
const lessonAddBtn = document.getElementById("lesson-add-btn")!;
const moduleSaveBtn = document.getElementById("module-save-btn")!;
const moduleShareBtn = document.getElementById("module-share-btn")!;
const moduleBuilderStatusEl = document.getElementById("module-builder-status")!;
const moduleDraftEl = document.getElementById("module-draft")!;

const TRIVIA_RUSH_ID = "trivia-rush";
const COLOR_CLASH_ID = "color-clash";
const FUSE_FRENZY_ID = "fuse-frenzy";
const HIGH_FOREST_ID = "high-forest-quest";

let library: GameLibraryEntry[] = [];
let activeGameId: string | null = null;
let fuseCountdownTimer: ReturnType<typeof setInterval> | null = null;
let studyPersistenceReady = false;
type BuilderQuestion = { id: string; prompt: string; choices: [string, string, string, string]; correctIndex: number; explanation: string };
let builderQuestions: BuilderQuestion[] = [];
const STUDY_STORAGE_KEY = "fleavo:host-study-board";
const MODULE_LIBRARY_KEY = "fleavo:teacher-modules";
type ModuleDraft = Omit<TeacherModule, "id"> & { sections: TeacherModule["sections"] };
let moduleSections: TeacherModule["sections"] = [];

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

function stopFuseCountdown() {
  if (fuseCountdownTimer) clearInterval(fuseCountdownTimer);
  fuseCountdownTimer = null;
}

function showOnly(section: HTMLElement) {
  if (section !== gameViewSection) stopFuseCountdown();
  for (const el of [lobbySection, studySection, gameViewSection, resultsSection]) {
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
const bootLabel = document.getElementById("boot-label")!;
const appShell = document.getElementById("app-shell")!;

const BOOT_MIN_MS = 1600;
const bootStartedAt = performance.now();
let roomIsReady = false;

function setBootProgress(_percent: number, label?: string) {
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

setBootProgress(12, "Opening Fleavo…");

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

const SETTINGS_KEY = "fleavo:tv-settings";

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
    } else if (target === "study") {
      showOnly(studySection);
      studyHome.classList.remove("hidden"); recreationRoom.classList.add("hidden");
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
  setTimeout(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STUDY_STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved) && saved.length) socket.emit("study:replace", { items: saved });
    } catch { /* a malformed local board is ignored */ }
    studyPersistenceReady = true;
  }, 60);
});

studyAddBtn.addEventListener("click", () => {
  const text = studyTextEl.value.trim();
  if (!text) return;
  socket.emit("study:add", { lane: studyLaneEl.value, text });
  studyTextEl.value = "";
});
document.getElementById("open-recreation")?.addEventListener("click", () => { studyHome.classList.add("hidden"); recreationRoom.classList.remove("hidden"); });
document.getElementById("back-to-study-home")?.addEventListener("click", () => { recreationRoom.classList.add("hidden"); studyHome.classList.remove("hidden"); });

studyTextEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") studyAddBtn.click();
});

socket.on("study:state", (board: { items: Array<{ id: string; lane: "notes" | "ideas" | "tasks"; text: string; done: boolean }> }) => {
  if (studyPersistenceReady) {
    try { localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(board.items)); } catch { /* storage is optional */ }
  }
  studyBoardEl.innerHTML = "";
  for (const lane of ["notes", "ideas", "tasks"] as const) {
    const column = document.createElement("section");
    column.className = "study-lane";
    column.innerHTML = "<h3>" + lane + "</h3>";
    for (const item of board.items.filter((entry) => entry.lane === lane)) {
      const row = document.createElement("div");
      row.className = "study-item" + (item.done ? " done" : "");
      const label = document.createElement("span");
      label.textContent = item.text;
      row.appendChild(label);
      const remove = document.createElement("button");
      remove.className = "study-delete";
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", (event) => { event.stopPropagation(); socket.emit("study:delete", { itemId: item.id }); });
      row.appendChild(remove);
      if (lane === "tasks") {
        row.tabIndex = 0;
        row.setAttribute("role", "button");
        row.setAttribute("aria-label", `${item.done ? "Reopen" : "Complete"} task: ${item.text}`);
        const toggle = () => socket.emit("study:toggle-task", { itemId: item.id });
        row.addEventListener("click", toggle);
        row.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        });
      }
      column.appendChild(row);
    }
    studyBoardEl.appendChild(column);
  }
});

type BoosterState = { loaded: false } | { loaded: true; title: string; topic?: string; audience?: string; questionIndex: number; totalQuestions: number; phase: "idle" | "question" | "reveal" | "complete"; question: { prompt: string; choices: string[] } | null; responseCount: number; correctIndex?: number; explanation?: string };

boosterImportBtn.addEventListener("click", () => socket.emit("booster:import", { content: boosterImportEl.value }));
boosterStartBtn.addEventListener("click", () => socket.emit("booster:start"));
boosterRevealBtn.addEventListener("click", () => socket.emit("booster:reveal"));
boosterNextBtn.addEventListener("click", () => socket.emit("booster:next"));

function renderBuilderDraft() {
  builderDraftEl.innerHTML = "";
  builderQuestions.forEach((question, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${question.prompt}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => { builderQuestions = builderQuestions.filter((entry) => entry.id !== question.id); renderBuilderDraft(); });
    item.appendChild(remove);
    builderDraftEl.appendChild(item);
  });
}

function clearBuilderFields() {
  builderPromptEl.value = "";
  builderChoiceEls.forEach((choice) => (choice.value = ""));
  builderExplanationEl.value = "";
  (document.querySelector<HTMLInputElement>("#builder-choices input[type=radio][value='0']")!).checked = true;
}

builderAddBtn.addEventListener("click", () => {
  const prompt = builderPromptEl.value.trim();
  const choices = builderChoiceEls.map((choice) => choice.value.trim());
  const explanation = builderExplanationEl.value.trim();
  const correct = Number(document.querySelector<HTMLInputElement>("#builder-choices input[type=radio]:checked")?.value);
  if (!prompt || choices.some((choice) => !choice) || !explanation) { builderStatusEl.textContent = "Add a question, four answers, and a short explanation."; return; }
  if (builderQuestions.length >= 24) { builderStatusEl.textContent = "Keep a quiz to 24 questions or fewer."; return; }
  builderQuestions.push({ id: crypto.randomUUID(), prompt, choices: choices as [string, string, string, string], correctIndex: correct, explanation });
  clearBuilderFields();
  builderStatusEl.textContent = `${builderQuestions.length} question${builderQuestions.length === 1 ? "" : "s"} ready to load.`;
  renderBuilderDraft();
});

builderClearBtn.addEventListener("click", () => { builderQuestions = []; clearBuilderFields(); builderStatusEl.textContent = "Draft cleared."; renderBuilderDraft(); });
builderLoadBtn.addEventListener("click", () => {
  const title = builderTitleEl.value.trim();
  if (!title || !builderQuestions.length) { builderStatusEl.textContent = "Give the quiz a title and add at least one question."; return; }
  socket.emit("booster:import", { content: JSON.stringify({ version: 1, title, topic: builderTopicEl.value.trim() || undefined, questions: builderQuestions }) });
});

function renderActiveModule(module: TeacherModule | null) {
  activeModuleEl.innerHTML = "";
  if (!module) { activeModuleEl.textContent = "No module is currently shared with this room."; return; }
  const title = document.createElement("h4"); title.textContent = `${module.title} · ${module.topic}`; activeModuleEl.appendChild(title);
  const overview = document.createElement("p"); overview.textContent = module.description; activeModuleEl.appendChild(overview);
  module.sections.forEach((section, index) => {
    const card = document.createElement("details"); card.className = "active-lesson"; card.open = index === 0;
    const summary = document.createElement("summary"); summary.textContent = `${index + 1}. ${section.title}`; card.appendChild(summary);
    const theory = document.createElement("p"); theory.textContent = section.theory; card.appendChild(theory);
    const practice = document.createElement("p"); practice.className = "lesson-practice"; practice.textContent = `Practice: ${section.practice}`; card.appendChild(practice);
    const solution = document.createElement("p"); solution.className = "lesson-solution"; solution.textContent = `Worked solution: ${section.solution}`; card.appendChild(solution);
    activeModuleEl.appendChild(card);
  });
}

function readModuleLibrary(): TeacherModule[] {
  try { const saved = JSON.parse(localStorage.getItem(MODULE_LIBRARY_KEY) ?? "[]"); return Array.isArray(saved) ? saved : []; } catch { return []; }
}

function saveModuleLibrary(modules: TeacherModule[]) { try { localStorage.setItem(MODULE_LIBRARY_KEY, JSON.stringify(modules)); } catch { moduleBuilderStatusEl.textContent = "Your browser could not save the module library."; } }

function renderSavedModules() {
  savedModulesEl.innerHTML = "";
  const saved = readModuleLibrary();
  if (!saved.length) { savedModulesEl.textContent = "Your local module library is empty. Build a lesson section, then save it here."; return; }
  saved.forEach((module) => {
    const card = document.createElement("article"); card.className = "saved-module";
    card.innerHTML = `<strong>${module.title}</strong><span>${module.topic} · ${module.sections.length} section${module.sections.length === 1 ? "" : "s"}</span>`;
    const open = document.createElement("button"); open.type = "button"; open.textContent = "Share to room"; open.addEventListener("click", () => socket.emit("module:load", { module })); card.appendChild(open);
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "quiet"; remove.textContent = "Delete"; remove.addEventListener("click", () => { saveModuleLibrary(readModuleLibrary().filter((entry) => entry.id !== module.id)); renderSavedModules(); }); card.appendChild(remove);
    savedModulesEl.appendChild(card);
  });
}

function renderModuleDraft() {
  moduleDraftEl.innerHTML = "";
  moduleSections.forEach((section, index) => {
    const item = document.createElement("li"); item.textContent = `${index + 1}. ${section.title}`;
    const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove"; remove.addEventListener("click", () => { moduleSections = moduleSections.filter((entry) => entry.id !== section.id); renderModuleDraft(); });
    item.appendChild(remove); moduleDraftEl.appendChild(item);
  });
}

function currentModuleDraft(): TeacherModule | null {
  const title = moduleTitleEl.value.trim(), topic = moduleTopicEl.value.trim(), description = moduleDescriptionEl.value.trim();
  if (!title || !topic || !description || !moduleSections.length) return null;
  return { id: crypto.randomUUID(), title, topic, description, sections: moduleSections };
}

function clearLessonFields() { lessonTitleEl.value = ""; lessonTheoryEl.value = ""; lessonPracticeEl.value = ""; lessonSolutionEl.value = ""; }

lessonAddBtn.addEventListener("click", () => {
  const title = lessonTitleEl.value.trim(), theory = lessonTheoryEl.value.trim(), practice = lessonPracticeEl.value.trim(), solution = lessonSolutionEl.value.trim();
  if (!title || !theory || !practice || !solution) { moduleBuilderStatusEl.textContent = "A lesson needs a title, theory, practice prompt, and worked solution."; return; }
  if (moduleSections.length >= 16) { moduleBuilderStatusEl.textContent = "Keep one module to 16 sections or fewer."; return; }
  moduleSections.push({ id: crypto.randomUUID(), title, theory, practice, solution }); clearLessonFields(); renderModuleDraft(); moduleBuilderStatusEl.textContent = `${moduleSections.length} section${moduleSections.length === 1 ? "" : "s"} ready.`;
});

moduleSaveBtn.addEventListener("click", () => {
  const module = currentModuleDraft();
  if (!module) { moduleBuilderStatusEl.textContent = "Add module details and at least one complete lesson section first."; return; }
  saveModuleLibrary([...readModuleLibrary(), module]); renderSavedModules(); moduleBuilderStatusEl.textContent = `Saved “${module.title}” to this browser.`;
});

moduleShareBtn.addEventListener("click", () => {
  const module = currentModuleDraft();
  if (!module) { moduleBuilderStatusEl.textContent = "Add module details and at least one complete lesson section first."; return; }
  socket.emit("module:load", { module });
});

starterModules.forEach((module) => {
  const card = document.createElement("article"); card.className = "starter-module";
  card.innerHTML = `<p>${module.topic}</p><h4>${module.title}</h4><span>${module.description}</span>`;
  const open = document.createElement("button"); open.type = "button"; open.textContent = "Open for room"; open.addEventListener("click", () => socket.emit("module:load", { module })); card.appendChild(open);
  starterModulesEl.appendChild(card);
});
renderSavedModules();

socket.on("module:error", (message: string) => { moduleBuilderStatusEl.textContent = message; });
socket.on("module:state", (module: TeacherModule | null) => { renderActiveModule(module); });

socket.on("booster:error", (message: string) => { boosterStatusEl.textContent = message; });
socket.on("booster:state", (state: BoosterState) => {
  if (!state.loaded) { boosterStatusEl.textContent = "Load a small course set to begin. Phone answers stay private."; boosterLiveEl.innerHTML = ""; return; }
  boosterImportEl.value = "";
  boosterStartBtn.toggleAttribute("disabled", state.phase !== "idle");
  boosterRevealBtn.toggleAttribute("disabled", state.phase !== "question");
  boosterNextBtn.toggleAttribute("disabled", state.phase !== "reveal");
  const position = `Question ${state.questionIndex + 1} of ${state.totalQuestions}`;
  boosterStatusEl.textContent = state.phase === "complete" ? `${state.title} is complete.` : `${state.title} · ${position} · ${state.responseCount} response${state.responseCount === 1 ? "" : "s"}`;
  boosterLiveEl.innerHTML = "";
  if (!state.question) return;
  const prompt = document.createElement("h4"); prompt.textContent = state.question.prompt; boosterLiveEl.appendChild(prompt);
  const choices = document.createElement("ol"); choices.className = "booster-choices";
  state.question.choices.forEach((choice, index) => { const item = document.createElement("li"); item.textContent = choice; if (state.phase === "reveal" && state.correctIndex === index) item.className = "correct"; choices.appendChild(item); });
  boosterLiveEl.appendChild(choices);
  if (state.phase === "reveal" && state.explanation) { const explanation = document.createElement("p"); explanation.className = "booster-explanation"; explanation.textContent = state.explanation; boosterLiveEl.appendChild(explanation); }
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

  if (room.phase === "lobby" && !studySection.classList.contains("hidden")) return;
  if (room.phase === "lobby") showOnly(lobbySection);
});

socket.on("game:started", (payload: GameStartedPayload) => {
  const game = library.find((g) => g.id === payload.gameId);
  activeGameId = payload.gameId;
  gameTitleEl.textContent = game?.name ?? payload.gameId;

  const isHighForest = payload.gameId === HIGH_FOREST_ID;
  const isTrivia = payload.gameId === TRIVIA_RUSH_ID;
  const isColorClash = payload.gameId === COLOR_CLASH_ID;
  const isFuseFrenzy = payload.gameId === FUSE_FRENZY_ID;

  highForestFrame.classList.toggle("hidden", !isHighForest);
  gameStageEl.classList.toggle("hidden", isHighForest || isTrivia || isColorClash);
  triviaViewEl.classList.toggle("hidden", !isTrivia);
  colorClashViewEl.classList.toggle("hidden", !isColorClash);

  if (isHighForest) {
    gameStageEl.textContent = "";
    highForestFrame.src = "/games/high-forest/index.html";
  } else {
    highForestFrame.src = "";
    if (isFuseFrenzy) gameStageEl.textContent = "Lighting the fuse…";
    else if (!isTrivia && !isColorClash) gameStageEl.textContent = "Get ready…";
  }
  showOnly(gameViewSection);
});

socket.on("game:input", (input: { action: string; pressed: boolean }) => {
  if (activeGameId !== HIGH_FOREST_ID || !highForestFrame.contentWindow) return;
  highForestFrame.contentWindow.postMessage({ type: "remote-input", ...input }, window.location.origin);
});

socket.on("game:state", (state: QuickDrawStage | TriviaStage | ColorClashStage | FuseFrenzyStage) => {
  if (state.stage === "fuse-turn") {
    stopFuseCountdown();
    const renderFuse = () => {
      const seconds = Math.max(0, (state.fuseEndsAt - Date.now()) / 1000);
      gameStageEl.textContent = state.holderName + " has the bomb · " + seconds.toFixed(1) + "s";
    };
    gameStageEl.className = "game-stage ready";
    renderFuse();
    fuseCountdownTimer = setInterval(renderFuse, 100);
  } else if (state.stage === "fuse-eliminated") {
    gameStageEl.className = "game-stage go";
    gameStageEl.textContent = state.playerName + " exploded!";
  } else if (state.stage === "color-question") {
    colorClashProgressEl.textContent = "Round " + (state.questionIndex + 1) + " / " + state.totalQuestions;
    colorClashWordEl.textContent = state.word.toUpperCase();
    colorClashWordEl.style.color = state.inkColor;
    colorClashRevealEl.textContent = "";
  } else if (state.stage === "color-reveal") {
    colorClashRevealEl.textContent = state.awards.length
      ? state.awards.map((award) => award.name + " +" + award.points + (award.streakBonus ? " streak!" : "")).join(" · ")
      : "No correct answers";
  } else if (state.stage === "ready") {
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

replayBtn.addEventListener("click", () => {
  socket.emit("room:play-again");
});

libraryBtn.addEventListener("click", () => {
  activeGameId = null;
  highForestFrame.src = "";
  socket.emit("room:return-to-library");
});

resetSessionBtn.addEventListener("click", () => {
  activeGameId = null;
  highForestFrame.src = "";
  socket.emit("room:reset-session");
});





