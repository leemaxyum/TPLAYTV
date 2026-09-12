import type { Server as SocketIOServer } from "socket.io";
import type {
  ColorClashResult,
  ColorClashStage,
  ColorName,
  ControllerDefinition,
  GameResultsPayload,
} from "../../src/platform/types.js";
import { toPublicState } from "../roomStore.js";
import type { InternalRoom } from "../roomStore.js";

export const COLOR_CLASH_ID = "color-clash";

export const colorClashController: ControllerDefinition = {
  type: "buttons",
  buttons: ["red", "blue", "green", "yellow"],
};

const COLORS: ColorName[] = ["red", "blue", "green", "yellow"];
const PROMPTS: Array<{ word: ColorName; inkColor: ColorName }> = [
  { word: "blue", inkColor: "red" },
  { word: "yellow", inkColor: "blue" },
  { word: "green", inkColor: "yellow" },
  { word: "red", inkColor: "green" },
  { word: "yellow", inkColor: "red" },
  { word: "blue", inkColor: "green" },
  { word: "red", inkColor: "yellow" },
  { word: "green", inkColor: "blue" },
];
const QUESTION_TIMEOUT_MS = 5000;
const REVEAL_GAP_MS = 1200;

type Answer = { color: ColorName; atMs: number };
type Totals = { points: number; correctCount: number; firstStreak: number };
type ActiveRound = {
  questionIndex: number;
  answers: Map<string, Answer>;
  totals: Map<string, Totals>;
  timeout: ReturnType<typeof setTimeout> | null;
};

const activeRounds = new Map<string, ActiveRound>();
const pendingNext = new Map<string, ReturnType<typeof setTimeout>>();

export function startColorClash(io: SocketIOServer, room: InternalRoom): void {
  const totals = new Map<string, Totals>();
  room.players.forEach((player) => totals.set(player.id, { points: 0, correctCount: 0, firstStreak: 0 }));
  runQuestion(io, room, 0, totals);
}

function runQuestion(
  io: SocketIOServer,
  room: InternalRoom,
  questionIndex: number,
  totals: Map<string, Totals>
): void {
  const prompt = PROMPTS[questionIndex];
  const active: ActiveRound = { questionIndex, answers: new Map(), totals, timeout: null };
  activeRounds.set(room.code, active);

  const state: ColorClashStage = {
    stage: "color-question",
    questionIndex,
    totalQuestions: PROMPTS.length,
    word: prompt.word,
    inkColor: prompt.inkColor,
    choices: COLORS,
    timeLimitMs: QUESTION_TIMEOUT_MS,
  };
  io.to(room.code).emit("game:state", state);
  active.timeout = setTimeout(() => finishQuestion(io, room), QUESTION_TIMEOUT_MS);
}

export function handleColorClashInput(
  io: SocketIOServer,
  room: InternalRoom,
  playerId: string,
  action: string
): void {
  const active = activeRounds.get(room.code);
  if (!active || active.answers.has(playerId) || !isColorName(action)) return;

  active.answers.set(playerId, { color: action, atMs: Date.now() });
  finishIfEveryoneAnswered(io, room);
}

export function handleColorClashDisconnect(io: SocketIOServer, room: InternalRoom): void {
  finishIfEveryoneAnswered(io, room);
}

function finishIfEveryoneAnswered(io: SocketIOServer, room: InternalRoom): void {
  const active = activeRounds.get(room.code);
  if (!active) return;
  const connectedPlayers = room.players.filter((player) => player.connected).length;
  if (active.answers.size >= connectedPlayers) {
    if (active.timeout) clearTimeout(active.timeout);
    finishQuestion(io, room);
  }
}

function finishQuestion(io: SocketIOServer, room: InternalRoom): void {
  const active = activeRounds.get(room.code);
  if (!active) return;
  activeRounds.delete(room.code);
  if (active.timeout) clearTimeout(active.timeout);

  const prompt = PROMPTS[active.questionIndex];
  const correct = [...active.answers.entries()]
    .filter(([, answer]) => answer.color === prompt.inkColor)
    .sort((a, b) => a[1].atMs - b[1].atMs);

  const firstPlayerId = correct[0]?.[0];
  const awards = correct.map(([playerId], index) => {
    const total = active.totals.get(playerId)!;
    const basePoints = Math.max(3 - index, 1);
    const streakBonus = playerId === firstPlayerId && total.firstStreak >= 1;
    total.points += basePoints + (streakBonus ? 1 : 0);
    total.correctCount += 1;
    return {
      playerId,
      name: room.players.find((player) => player.id === playerId)?.name ?? "Player",
      points: basePoints + (streakBonus ? 1 : 0),
      streakBonus,
    };
  });

  active.totals.forEach((total, playerId) => {
    total.firstStreak = playerId === firstPlayerId ? total.firstStreak + 1 : 0;
  });

  const reveal: ColorClashStage = {
    stage: "color-reveal",
    questionIndex: active.questionIndex,
    correctColor: prompt.inkColor,
    awards,
  };
  io.to(room.code).emit("game:state", reveal);

  const next = setTimeout(() => {
    if (active.questionIndex >= PROMPTS.length - 1) {
      finishGame(io, room, active.totals);
    } else {
      runQuestion(io, room, active.questionIndex + 1, active.totals);
    }
  }, REVEAL_GAP_MS);
  pendingNext.set(room.code, next);
}

function finishGame(io: SocketIOServer, room: InternalRoom, totals: Map<string, Totals>): void {
  const rankings: ColorClashResult[] = room.players
    .map((player) => {
      const total = totals.get(player.id) ?? { points: 0, correctCount: 0 };
      return { playerId: player.id, name: player.name, points: total.points, correctCount: total.correctCount };
    })
    .sort((a, b) => b.points - a.points || b.correctCount - a.correctCount);

  rankings.forEach((ranking, index) => {
    const player = room.players.find((entry) => entry.id === ranking.playerId);
    if (player && ranking.points > 0) player.score += Math.max(rankings.length - index, 1);
  });

  room.phase = "results";
  io.to(room.code).emit("game:results", { gameId: COLOR_CLASH_ID, rankings } satisfies GameResultsPayload);
  io.to(room.code).emit("room:state", toPublicState(room));
}

function isColorName(value: string): value is ColorName {
  return COLORS.includes(value as ColorName);
}

export function cancelColorClash(roomCode: string): void {
  const active = activeRounds.get(roomCode);
  if (active?.timeout) clearTimeout(active.timeout);
  activeRounds.delete(roomCode);

  const pending = pendingNext.get(roomCode);
  if (pending) clearTimeout(pending);
  pendingNext.delete(roomCode);
}
