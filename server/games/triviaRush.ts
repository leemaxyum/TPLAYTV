import type { Server as SocketIOServer } from "socket.io";
import type {
  ControllerDefinition,
  GameResultsPayload,
  TriviaResult,
  TriviaStage,
} from "../../src/platform/types.js";
import type { InternalRoom } from "../roomStore.js";
import { toPublicState } from "../roomStore.js";

export const TRIVIA_RUSH_ID = "trivia-rush";

export const triviaRushController: ControllerDefinition = {
  type: "buttons",
  buttons: ["A", "B", "C", "D"],
};

// Small fixed question bank. Easy to extend later — each entry is
// { prompt, options: [4], correctIndex }. Keep prompts short; the TV
// renders them large for readability from across a room.
const QUESTIONS: Array<{ prompt: string; options: [string, string, string, string]; correctIndex: number }> = [
  { prompt: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unicode"], correctIndex: 0 },
  { prompt: "Which language runs natively in web browsers?", options: ["Python", "JavaScript", "C++", "Rust"], correctIndex: 1 },
  { prompt: "What year was GitHub founded?", options: ["2005", "2008", "2011", "2014"], correctIndex: 1 },
  { prompt: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Transfer Text Process", "Host Transmission Protocol", "HyperText Transmission Process"], correctIndex: 0 },
  { prompt: "Which of these is NOT a JavaScript framework?", options: ["React", "Vue", "Django", "Svelte"], correctIndex: 2 },
  { prompt: "What does 'git commit' do?", options: ["Deletes a branch", "Saves a snapshot of staged changes", "Uploads to GitHub", "Creates a new repo"], correctIndex: 1 },
  { prompt: "What's the time complexity of binary search?", options: ["O(n)", "O(n^2)", "O(log n)", "O(1)"], correctIndex: 2 },
  { prompt: "Which company created TypeScript?", options: ["Google", "Facebook", "Microsoft", "Amazon"], correctIndex: 2 },
];

const TOTAL_QUESTIONS = QUESTIONS.length;
const QUESTION_TIMEOUT_MS = 6000;
const REVEAL_GAP_MS = 1600;

type Answer = { optionIndex: number; atMs: number };

type ActiveRound = {
  questionIndex: number;
  questionStartAt: number;
  answers: Map<string, Answer>;
  timeout: ReturnType<typeof setTimeout> | null;
  totals: Map<string, { points: number; correctCount: number }>;
};

const activeRounds = new Map<string, ActiveRound>();
const pendingNext = new Map<string, ReturnType<typeof setTimeout>>();

export function startTriviaRush(io: SocketIOServer, room: InternalRoom): void {
  const totals = new Map<string, { points: number; correctCount: number }>();
  for (const p of room.players) totals.set(p.id, { points: 0, correctCount: 0 });
  runQuestion(io, room, 0, totals);
}

function runQuestion(
  io: SocketIOServer,
  room: InternalRoom,
  questionIndex: number,
  totals: Map<string, { points: number; correctCount: number }>
): void {
  const q = QUESTIONS[questionIndex];
  const active: ActiveRound = {
    questionIndex,
    questionStartAt: Date.now(),
    answers: new Map(),
    timeout: null,
    totals,
  };
  activeRounds.set(room.code, active);

  const state: TriviaStage = {
    stage: "question",
    questionIndex,
    totalQuestions: TOTAL_QUESTIONS,
    prompt: q.prompt,
    options: q.options,
    timeLimitMs: QUESTION_TIMEOUT_MS,
  };
  io.to(room.code).emit("game:state", state);

  active.timeout = setTimeout(() => finishQuestion(io, room), QUESTION_TIMEOUT_MS);
}

export function handleTriviaInput(
  io: SocketIOServer,
  room: InternalRoom,
  playerId: string,
  action: string
): void {
  const active = activeRounds.get(room.code);
  if (!active) return;
  if (active.answers.has(playerId)) return; // only first answer per question counts

  const optionIndex = ["A", "B", "C", "D"].indexOf(action);
  if (optionIndex === -1) return; // malformed/unknown input, ignore

  active.answers.set(playerId, { optionIndex, atMs: Date.now() });

  const connectedCount = room.players.filter((p) => p.connected).length;
  if (active.answers.size >= connectedCount) {
    if (active.timeout) clearTimeout(active.timeout);
    finishQuestion(io, room);
  }
}

function finishQuestion(io: SocketIOServer, room: InternalRoom): void {
  const active = activeRounds.get(room.code);
  if (!active) return;
  activeRounds.delete(room.code);
  if (active.timeout) clearTimeout(active.timeout);

  const q = QUESTIONS[active.questionIndex];

  const correct = [...active.answers.entries()]
    .filter(([, a]) => a.optionIndex === q.correctIndex)
    .sort((a, b) => a[1].atMs - b[1].atMs);

  correct.forEach(([playerId], i) => {
    const entry = active.totals.get(playerId);
    if (!entry) return;
    entry.points += Math.max(3 - i, 1);
    entry.correctCount += 1;
  });

  const revealState: TriviaStage = {
    stage: "reveal",
    questionIndex: active.questionIndex,
    correctIndex: q.correctIndex,
  };
  io.to(room.code).emit("game:state", revealState);

  const isLastQuestion = active.questionIndex >= TOTAL_QUESTIONS - 1;
  const t = setTimeout(() => {
    if (isLastQuestion) {
      finishGame(io, room, active.totals);
    } else {
      runQuestion(io, room, active.questionIndex + 1, active.totals);
    }
  }, REVEAL_GAP_MS);
  pendingNext.set(room.code, t);
}

function finishGame(
  io: SocketIOServer,
  room: InternalRoom,
  totals: Map<string, { points: number; correctCount: number }>
): void {
  const rankings: TriviaResult[] = room.players
    .map((player) => {
      const t = totals.get(player.id) ?? { points: 0, correctCount: 0 };
      return { playerId: player.id, name: player.name, points: t.points, correctCount: t.correctCount };
    })
    .sort((a, b) => b.points - a.points);

  rankings.forEach((r, i) => {
    const player = room.players.find((p) => p.id === r.playerId);
    if (player && r.points > 0) {
      player.score += Math.max(rankings.length - i, 1);
    }
  });

  room.phase = "results";
  const payload: GameResultsPayload = { gameId: TRIVIA_RUSH_ID, rankings };
  io.to(room.code).emit("game:results", payload);
  io.to(room.code).emit("room:state", toPublicState(room));
}

export function cancelTriviaRush(roomCode: string): void {
  const active = activeRounds.get(roomCode);
  if (active?.timeout) clearTimeout(active.timeout);
  activeRounds.delete(roomCode);

  const pending = pendingNext.get(roomCode);
  if (pending) clearTimeout(pending);
  pendingNext.delete(roomCode);
}
