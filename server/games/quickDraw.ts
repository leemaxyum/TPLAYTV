import type { Server as SocketIOServer } from "socket.io";
import type {
  ControllerDefinition,
  GameResultsPayload,
  QuickDrawResult,
  QuickDrawStage,
} from "../../src/platform/types.js";
import type { InternalRoom } from "../roomStore.js";
import { toPublicState } from "../roomStore.js";

export const QUICK_DRAW_ID = "quick-draw";

export const quickDrawController: ControllerDefinition = {
  type: "buttons",
  buttons: ["tap"],
};

const READY_DELAY_MS = 1500;
const MIN_GO_DELAY_MS = 1500;
const MAX_GO_DELAY_MS = 4500;
const RESULT_TIMEOUT_MS = 8000; // stop waiting for stragglers after this long

type ActiveRound = {
  goAt: number | null;
  taps: Map<string, { atMs: number; falseStart: boolean }>;
  timeout: ReturnType<typeof setTimeout> | null;
};

const activeRounds = new Map<string, ActiveRound>();

export function startQuickDraw(io: SocketIOServer, room: InternalRoom): void {
  const round: ActiveRound = { goAt: null, taps: new Map(), timeout: null };
  activeRounds.set(room.code, round);

  const readyState: QuickDrawStage = { stage: "ready" };
  io.to(room.code).emit("game:state", readyState);

  setTimeout(() => {
    // Room may have been torn down (host left, return-to-library) while waiting.
    if (!activeRounds.has(room.code)) return;

    const delay =
      MIN_GO_DELAY_MS + Math.random() * (MAX_GO_DELAY_MS - MIN_GO_DELAY_MS);

    setTimeout(() => {
      if (!activeRounds.has(room.code)) return;
      round.goAt = Date.now();
      const goState: QuickDrawStage = { stage: "go", goAt: round.goAt };
      io.to(room.code).emit("game:state", goState);

      round.timeout = setTimeout(() => {
        finishRound(io, room);
      }, RESULT_TIMEOUT_MS);
    }, delay);
  }, READY_DELAY_MS);
}

export function handleQuickDrawInput(
  io: SocketIOServer,
  room: InternalRoom,
  playerId: string
): void {
  const round = activeRounds.get(room.code);
  if (!round) return;
  if (round.taps.has(playerId)) return; // only first tap counts

  const now = Date.now();
  if (round.goAt === null) {
    round.taps.set(playerId, { atMs: now, falseStart: true });
  } else {
    round.taps.set(playerId, { atMs: now, falseStart: false });
  }

  const connectedCount = room.players.filter((p) => p.connected).length;
  if (round.goAt !== null && round.taps.size >= connectedCount) {
    if (round.timeout) clearTimeout(round.timeout);
    finishRound(io, room);
  }
}

function finishRound(io: SocketIOServer, room: InternalRoom): void {
  const round = activeRounds.get(room.code);
  if (!round) return;
  activeRounds.delete(room.code);
  if (round.timeout) clearTimeout(round.timeout);

  const rankings: QuickDrawResult[] = room.players.map((player) => {
    const tap = round.taps.get(player.id);
    if (!tap) {
      return { playerId: player.id, name: player.name, reactionMs: null, falseStart: false };
    }
    if (tap.falseStart || round.goAt === null) {
      return { playerId: player.id, name: player.name, reactionMs: null, falseStart: true };
    }
    return {
      playerId: player.id,
      name: player.name,
      reactionMs: tap.atMs - round.goAt,
      falseStart: false,
    };
  });

  // Valid reaction times first (fastest wins), then false starts, then no-taps.
  rankings.sort((a, b) => {
    if (a.reactionMs !== null && b.reactionMs !== null) return a.reactionMs - b.reactionMs;
    if (a.reactionMs !== null) return -1;
    if (b.reactionMs !== null) return 1;
    if (a.falseStart !== b.falseStart) return a.falseStart ? 1 : -1;
    return 0;
  });

  // Award simple placement score: 1st = most points.
  rankings.forEach((r, i) => {
    const player = room.players.find((p) => p.id === r.playerId);
    if (player && r.reactionMs !== null) {
      player.score += Math.max(rankings.length - i, 1);
    }
  });

  room.phase = "results";
  const payload: GameResultsPayload = { gameId: QUICK_DRAW_ID, rankings };
  io.to(room.code).emit("game:results", payload);
  io.to(room.code).emit("room:state", toPublicState(room));
}

export function cancelQuickDraw(roomCode: string): void {
  const round = activeRounds.get(roomCode);
  if (round?.timeout) clearTimeout(round.timeout);
  activeRounds.delete(roomCode);
}
