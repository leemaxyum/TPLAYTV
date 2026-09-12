import { connectSocket } from "../src/network/client";
import type {
  ColorClashStage,
  ControllerInputPayload,
  FuseFrenzyStage,
  GameResultsPayload,
  GameStartedPayload,
  RoomClosedPayload,
  RoomJoinedPayload,
  RoomState,
  ServerErrorPayload,
  TriviaStage,
} from "../src/platform/types";

const socket = connectSocket();

const form = document.getElementById("join-form") as HTMLFormElement;
const roomCodeInput = document.getElementById("room-code") as HTMLInputElement;
const nameInput = document.getElementById("name") as HTMLInputElement;
const errorEl = document.getElementById("error")!;
const waitingEl = document.getElementById("waiting")!;
const participantNameEl = document.getElementById("participant-name")!;
const participantStatusEl = document.getElementById("participant-status")!;
const controllerViewEl = document.getElementById("controller-view")!;
const triviaControllerEl = document.getElementById("trivia-controller")!;
const triviaStatusEl = document.getElementById("trivia-status")!;
const triviaButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#trivia-grid .trivia-btn")
);
const colorControllerEl = document.getElementById("color-controller")!;
const colorStatusEl = document.getElementById("color-status")!;
const colorButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("#color-grid .color-btn"));
const resultsViewEl = document.getElementById("results-view")!;
const resultTextEl = document.getElementById("result-text")!;
const tapButton = document.getElementById("tap-button") as HTMLButtonElement;
const forestControllerEl = document.getElementById("forest-controller")!;

let myPlayerId: string | null = null;
let tapSequence = 0;
let singleButtonAction = "tap";

function showOnly(section: HTMLElement) {
  for (const el of [waitingEl, controllerViewEl, triviaControllerEl, colorControllerEl, forestControllerEl, resultsViewEl]) {
    el.classList.toggle("hidden", el !== section);
  }
}

// ===========================================================================
// Reconnect — if this phone already joined a room (saved in localStorage),
// try to resume that exact player identity before showing the join form.
// This matters most mid-game: a dropped Wi-Fi connection or an accidental
// tab reload shouldn't force rejoining and losing your score.
// ===========================================================================

type SavedSession = { code: string; playerId: string };
const SESSION_KEY = "stellarplay:session";

function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.code === "string" && typeof parsed?.playerId === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveSession(session: SavedSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage can fail (private browsing, quota) — reconnect just won't work next time.
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

let attemptedReconnect = false;

// Pre-fill the room code from the QR link: /controller/?room=7K4P
const params = new URLSearchParams(window.location.search);
const roomFromUrl = params.get("room");
if (roomFromUrl) {
  roomCodeInput.value = roomFromUrl.toUpperCase();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  errorEl.textContent = "";
  const code = roomCodeInput.value.trim().toUpperCase();
  const name = nameInput.value.trim();

  if (!code || !name) {
    errorEl.textContent = "Enter a room code and a name.";
    return;
  }

  socket.emit("room:join", { code, name });
});

socket.on("connect", () => {
  const saved = loadSession();
  if (saved && !attemptedReconnect) {
    attemptedReconnect = true;
    socket.emit("player:reconnect", saved);
  }
});

socket.on("room:joined", (payload: RoomJoinedPayload) => {
  myPlayerId = payload.playerId;
  saveSession({ code: payload.code, playerId: payload.playerId });
  participantNameEl.textContent = nameInput.value.trim() || "You're in";
  participantStatusEl.textContent = "Connected to room " + payload.code + ". Waiting for the host…";
  form.classList.add("hidden");
  showOnly(waitingEl);
});

socket.on("connection:error", (err: ServerErrorPayload) => {
  // A failed reconnect attempt (expired room/player) should silently fall
  // back to the join form rather than scaring the person with an error for
  // something they didn't do.
  if (err.code === "ROOM_NOT_FOUND" || err.code === "PLAYER_NOT_FOUND") {
    if (attemptedReconnect) {
      clearSession();
      form.classList.remove("hidden");
      for (const el of [waitingEl, controllerViewEl, triviaControllerEl, colorControllerEl, forestControllerEl, resultsViewEl]) {
        el.classList.add("hidden");
      }
      return;
    }
  }
  errorEl.textContent = err.message;
});

socket.on("disconnect", () => {
  errorEl.textContent = "Lost connection to the host. Reconnecting…";
});

socket.on("room:closed", (payload: RoomClosedPayload) => {
  clearSession();
  myPlayerId = null;
  form.classList.remove("hidden");
  for (const el of [waitingEl, controllerViewEl, triviaControllerEl, colorControllerEl, forestControllerEl, resultsViewEl]) {
    el.classList.add("hidden");
  }
  errorEl.textContent = payload.message;
});

socket.on("room:state", (room: RoomState) => {
  if (!myPlayerId) return;
  if (room.phase === "lobby") {
    const me = room.players.find((player) => player.id === myPlayerId);
    participantStatusEl.textContent = (me?.connected ? "You’re connected" : "Reconnecting…") + " · " + room.players.length + " participants in room";
    showOnly(waitingEl);
  }
});

socket.on("game:started", (payload: GameStartedPayload) => {
  if (payload.gameId === "color-clash") {
    colorStatusEl.textContent = "Match the ink colour, not the word.";
    colorButtons.forEach((button) => { button.disabled = false; button.classList.remove("selected", "correct", "incorrect"); });
    showOnly(colorControllerEl);
    return;
  }
  if (payload.controller.type === "dpad") {
    showOnly(forestControllerEl);
    return;
  }
  if (payload.controller.type === "buttons" && payload.controller.buttons.length > 1) {
    triviaStatusEl.textContent = "Get ready…";
    triviaButtons.forEach((btn) => (btn.disabled = false));
    showOnly(triviaControllerEl);
    return;
  }
  if (payload.controller.type === "buttons" && payload.controller.buttons.length === 1) {
    singleButtonAction = payload.controller.buttons[0];
    tapButton.textContent = singleButtonAction.toUpperCase();
  }
  tapButton.disabled = false;
  showOnly(controllerViewEl);
});

tapButton.addEventListener("click", () => {
  const input: ControllerInputPayload = { action: singleButtonAction, sequence: tapSequence++ };
  socket.emit("controller:input", input);
  tapButton.disabled = true;
});

triviaButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const option = btn.dataset.option!;
    const input: ControllerInputPayload = { action: option, sequence: tapSequence++ };
    socket.emit("controller:input", input);
    triviaButtons.forEach((b) => (b.disabled = true));
    btn.classList.add("selected");
  });
});

colorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    socket.emit("controller:input", { action: button.dataset.color!, sequence: tapSequence++ } satisfies ControllerInputPayload);
    colorButtons.forEach((entry) => (entry.disabled = true));
    button.classList.add("selected");
  });
});

socket.on("game:state", (state: TriviaStage | ColorClashStage | FuseFrenzyStage) => {
  if (state.stage === "fuse-turn") {
    tapButton.disabled = state.holderId !== myPlayerId;
    tapButton.textContent = state.holderId === myPlayerId ? "PASS" : "WAIT";
  } else if (state.stage === "fuse-eliminated") {
    tapButton.disabled = true;
  } else if (state.stage === "color-question") {
    colorStatusEl.textContent = "Round " + (state.questionIndex + 1) + " / " + state.totalQuestions + " — match the ink";
    colorButtons.forEach((button) => {
      button.disabled = false;
      button.classList.remove("selected", "correct", "incorrect");
    });
  } else if (state.stage === "color-reveal") {
    colorStatusEl.textContent = state.awards.length ? state.awards[0].name + " was fastest!" : "No correct answers.";
    colorButtons.forEach((button) => {
      button.disabled = true;
      if (button.dataset.color === state.correctColor) button.classList.add("correct");
      else if (button.classList.contains("selected")) button.classList.add("incorrect");
    });
  } else if (state.stage === "question") {
    triviaStatusEl.textContent = `Question ${state.questionIndex + 1} / ${state.totalQuestions}`;
    triviaButtons.forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove("selected", "correct", "incorrect");
    });
  } else if (state.stage === "reveal") {
    const correctBtn = triviaButtons[state.correctIndex];
    triviaButtons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === state.correctIndex) btn.classList.add("correct");
      else if (btn.classList.contains("selected")) btn.classList.add("incorrect");
    });
    if (correctBtn) triviaStatusEl.textContent = "Revealing…";
  }
});

forestControllerEl.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
  const action = button.dataset.action!;
  const send = (pressed: boolean) => socket.emit("controller:input", { action, pressed, sequence: tapSequence++ });
  button.addEventListener("pointerdown", (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); send(true); });
  button.addEventListener("pointerup", () => send(false));
  button.addEventListener("pointercancel", () => send(false));
  button.addEventListener("lostpointercapture", () => send(false));
});

socket.on("game:results", (payload: GameResultsPayload) => {
  const mine = payload.rankings.find((r) => r.playerId === myPlayerId);
  if (mine && "reactionMs" in mine) {
    resultTextEl.textContent = mine.falseStart
      ? "False start!"
      : mine.reactionMs !== null
      ? `Your time: ${mine.reactionMs} ms`
      : "You didn't tap in time.";
  } else if (mine && "correctCount" in mine) {
    resultTextEl.textContent = `${mine.correctCount} correct — ${mine.points} points`;
  }
  showOnly(resultsViewEl);
});
