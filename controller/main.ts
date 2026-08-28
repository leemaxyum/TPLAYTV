import { connectSocket } from "../src/network/client";
import type {
  ControllerInputPayload,
  GameResultsPayload,
  GameStartedPayload,
  RoomJoinedPayload,
  RoomState,
  ServerErrorPayload,
} from "../src/platform/types";

const socket = connectSocket();

const form = document.getElementById("join-form") as HTMLFormElement;
const roomCodeInput = document.getElementById("room-code") as HTMLInputElement;
const nameInput = document.getElementById("name") as HTMLInputElement;
const errorEl = document.getElementById("error")!;
const waitingEl = document.getElementById("waiting")!;
const controllerViewEl = document.getElementById("controller-view")!;
const resultsViewEl = document.getElementById("results-view")!;
const resultTextEl = document.getElementById("result-text")!;
const tapButton = document.getElementById("tap-button") as HTMLButtonElement;
const forestControllerEl = document.getElementById("forest-controller")!;

let myPlayerId: string | null = null;
let tapSequence = 0;

function showOnly(section: HTMLElement) {
  for (const el of [waitingEl, controllerViewEl, forestControllerEl, resultsViewEl]) {
    el.classList.toggle("hidden", el !== section);
  }
}

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

socket.on("room:joined", (payload: RoomJoinedPayload) => {
  myPlayerId = payload.playerId;
  form.classList.add("hidden");
  showOnly(waitingEl);
});

socket.on("connection:error", (err: ServerErrorPayload) => {
  errorEl.textContent = err.message;
});

socket.on("disconnect", () => {
  errorEl.textContent = "Lost connection to the host. Reconnecting…";
});

socket.on("room:state", (room: RoomState) => {
  if (!myPlayerId) return;
  if (room.phase === "lobby") showOnly(waitingEl);
});

socket.on("game:started", (payload: GameStartedPayload) => {
  if (payload.controller.type === "dpad") {
    showOnly(forestControllerEl);
    return;
  }
  if (payload.controller.type === "buttons" && payload.controller.buttons.length === 1) {
    tapButton.textContent = payload.controller.buttons[0].toUpperCase();
  }
  tapButton.disabled = false;
  showOnly(controllerViewEl);
});

tapButton.addEventListener("click", () => {
  const input: ControllerInputPayload = { action: "tap", sequence: tapSequence++ };
  socket.emit("controller:input", input);
  tapButton.disabled = true;
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
  if (mine) {
    resultTextEl.textContent = mine.falseStart
      ? "False start!"
      : mine.reactionMs !== null
      ? `Your time: ${mine.reactionMs} ms`
      : "You didn't tap in time.";
  }
  showOnly(resultsViewEl);
});
