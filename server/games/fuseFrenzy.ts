import type { Server as SocketIOServer } from "socket.io";
import type {
  ControllerDefinition,
  FuseFrenzyResult,
  FuseFrenzyStage,
  GameResultsPayload,
} from "../../src/platform/types.js";
import { toPublicState } from "../roomStore.js";
import type { InternalRoom } from "../roomStore.js";

export const FUSE_FRENZY_ID = "fuse-frenzy";
export const fuseFrenzyController: ControllerDefinition = { type: "buttons", buttons: ["pass"] };

const START_FUSE_MS = 20000;
const MIN_FUSE_MS = 12000;
const FUSE_STEP_MS = 1200;
const PASS_COOLDOWN_MS = 350;
const ELIMINATION_REVEAL_MS = 1300;

type ActiveMatch = {
  remaining: Set<string>;
  points: Map<string, number>;
  holderId: string;
  round: number;
  fuseMs: number;
  fuseEndsAt: number;
  lastPassAt: number;
  timeout: ReturnType<typeof setTimeout> | null;
  nextTimer: ReturnType<typeof setTimeout> | null;
};

const matches = new Map<string, ActiveMatch>();

export function startFuseFrenzy(io: SocketIOServer, room: InternalRoom): void {
  const eligible = room.players.filter((player) => player.connected).map((player) => player.id);
  const holderId = choose(eligible);
  if (!holderId) return;
  const match: ActiveMatch = {
    remaining: new Set(eligible),
    points: new Map(room.players.map((player) => [player.id, 0])),
    holderId,
    round: 1,
    fuseMs: START_FUSE_MS,
    fuseEndsAt: 0,
    lastPassAt: 0,
    timeout: null,
    nextTimer: null,
  };
  matches.set(room.code, match);
  beginTurn(io, room, match);
}

export function handleFuseFrenzyInput(io: SocketIOServer, room: InternalRoom, playerId: string): void {
  const match = matches.get(room.code);
  if (!match || match.holderId !== playerId || !match.remaining.has(playerId)) return;
  const now = Date.now();
  if (now - match.lastPassAt < PASS_COOLDOWN_MS) return;
  const targets = eligiblePlayers(room, match).filter((id) => id !== playerId);
  const nextHolder = choose(targets);
  if (!nextHolder) return;
  match.lastPassAt = now;
  match.holderId = nextHolder;
  beginTurn(io, room, match);
}

export function handleFuseFrenzyDisconnect(io: SocketIOServer, room: InternalRoom, playerId: string): void {
  const match = matches.get(room.code);
  if (!match || !match.remaining.has(playerId)) return;
  if (match.holderId !== playerId) return;
  const targets = eligiblePlayers(room, match).filter((id) => id !== playerId);
  const nextHolder = choose(targets);
  if (!nextHolder) {
    finishMatch(io, room, match);
    return;
  }
  match.holderId = nextHolder;
  beginTurn(io, room, match);
}

function beginTurn(io: SocketIOServer, room: InternalRoom, match: ActiveMatch): void {
  if (match.timeout) clearTimeout(match.timeout);
  const eligible = eligiblePlayers(room, match);
  if (eligible.length < 2) {
    finishMatch(io, room, match);
    return;
  }
  if (!eligible.includes(match.holderId)) {
    const replacement = choose(eligible);
    if (!replacement) return;
    match.holderId = replacement;
  }
  match.fuseEndsAt = Date.now() + match.fuseMs;
  const holder = room.players.find((player) => player.id === match.holderId);
  const state: FuseFrenzyStage = {
    stage: "fuse-turn",
    holderId: match.holderId,
    holderName: holder?.name ?? "Player",
    fuseEndsAt: match.fuseEndsAt,
    round: match.round,
    remainingPlayerIds: eligible,
  };
  io.to(room.code).emit("game:state", state);
  match.timeout = setTimeout(() => eliminateHolder(io, room, match), match.fuseMs);
}

function eliminateHolder(io: SocketIOServer, room: InternalRoom, match: ActiveMatch): void {
  const eliminatedId = match.holderId;
  if (!match.remaining.delete(eliminatedId)) return;
  if (match.timeout) clearTimeout(match.timeout);
  match.timeout = null;

  const remaining = eligiblePlayers(room, match);
  remaining.forEach((id) => match.points.set(id, (match.points.get(id) ?? 0) + 1));
  const eliminated = room.players.find((player) => player.id === eliminatedId);
  io.to(room.code).emit("game:state", {
    stage: "fuse-eliminated",
    playerId: eliminatedId,
    playerName: eliminated?.name ?? "Player",
    remainingPlayerIds: remaining,
  } satisfies FuseFrenzyStage);

  if (remaining.length <= 1) {
    match.nextTimer = setTimeout(() => finishMatch(io, room, match), ELIMINATION_REVEAL_MS);
    return;
  }
  match.round += 1;
  match.fuseMs = Math.max(MIN_FUSE_MS, match.fuseMs - FUSE_STEP_MS);
  match.holderId = choose(remaining)!;
  match.nextTimer = setTimeout(() => beginTurn(io, room, match), ELIMINATION_REVEAL_MS);
}

function finishMatch(io: SocketIOServer, room: InternalRoom, match: ActiveMatch): void {
  if (!matches.has(room.code)) return;
  cancelFuseFrenzy(room.code);
  const winnerId = eligiblePlayers(room, match)[0];
  if (winnerId) match.points.set(winnerId, (match.points.get(winnerId) ?? 0) + 3);
  const rankings: FuseFrenzyResult[] = room.players
    .map((player) => ({ playerId: player.id, name: player.name, points: match.points.get(player.id) ?? 0, correctCount: 0 }))
    .sort((a, b) => b.points - a.points);
  rankings.forEach((ranking, index) => {
    const player = room.players.find((entry) => entry.id === ranking.playerId);
    if (player && ranking.points > 0) player.score += Math.max(rankings.length - index, 1);
  });
  room.phase = "results";
  io.to(room.code).emit("game:results", { gameId: FUSE_FRENZY_ID, rankings } satisfies GameResultsPayload);
  io.to(room.code).emit("room:state", toPublicState(room));
}

function eligiblePlayers(room: InternalRoom, match: ActiveMatch): string[] {
  return room.players.filter((player) => player.connected && match.remaining.has(player.id)).map((player) => player.id);
}

function choose<T>(items: T[]): T | undefined {
  return items.length ? items[Math.floor(Math.random() * items.length)] : undefined;
}

export function cancelFuseFrenzy(roomCode: string): void {
  const match = matches.get(roomCode);
  if (match?.timeout) clearTimeout(match.timeout);
  if (match?.nextTimer) clearTimeout(match.nextTimer);
  matches.delete(roomCode);
}
