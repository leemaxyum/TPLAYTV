import type { PlayerState, RoomState } from "../src/platform/types.js";
import { generateRoomCode } from "./roomCode.js";

// Internal bookkeeping alongside each room (not sent to clients as-is).
export type InternalRoom = RoomState & {
  hostSocketId: string | null;
  // playerId -> pending removal timer, used for the reconnect grace period.
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
};

const DISCONNECT_GRACE_MS = 30_000;
const MAX_PLAYERS = 8;
const MAX_NAME_LENGTH = 20;

const rooms = new Map<string, InternalRoom>();

export function createRoom(hostSocketId: string): InternalRoom {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();

  const room: InternalRoom = {
    code,
    phase: "lobby",
    gameId: null,
    players: [],
    hostSocketId,
    disconnectTimers: new Map(),
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): InternalRoom | undefined {
  return rooms.get(code.toUpperCase());
}

export function sanitizeName(rawName: unknown): string | null {
  if (typeof rawName !== "string") return null;
  const trimmed = rawName.trim().slice(0, MAX_NAME_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

export function isRoomFull(room: InternalRoom): boolean {
  return room.players.filter((p) => p.connected).length >= MAX_PLAYERS;
}

// Names are part of the TV-facing player identity. Keep them unique while a
// player is still in the room, including during the reconnect grace period,
// so the host never has to guess which "Alex" is which.
export function hasPlayerNamed(room: InternalRoom, name: string): boolean {
  const normalizedName = name.toLocaleLowerCase();
  return room.players.some((player) => player.name.toLocaleLowerCase() === normalizedName);
}

export function addPlayer(
  room: InternalRoom,
  playerId: string,
  name: string
): PlayerState {
  const player: PlayerState = {
    id: playerId,
    name,
    connected: true,
    ready: false,
    score: 0,
  };
  room.players.push(player);
  return player;
}

export function markDisconnected(
  room: InternalRoom,
  playerId: string,
  onExpire: () => void
): void {
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;
  player.connected = false;

  const existing = room.disconnectTimers.get(playerId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    room.players = room.players.filter((p) => p.id !== playerId);
    room.disconnectTimers.delete(playerId);
    onExpire();
  }, DISCONNECT_GRACE_MS);
  room.disconnectTimers.set(playerId, timer);
}

export function reconnectPlayer(room: InternalRoom, playerId: string): boolean {
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return false;
  player.connected = true;
  const timer = room.disconnectTimers.get(playerId);
  if (timer) {
    clearTimeout(timer);
    room.disconnectTimers.delete(playerId);
  }
  return true;
}

export function toPublicState(room: InternalRoom): RoomState {
  return {
    code: room.code,
    phase: room.phase,
    gameId: room.gameId,
    players: room.players,
  };
}

export function deleteRoomIfEmpty(room: InternalRoom): void {
  const hasHost = room.hostSocketId !== null;
  const hasPlayers = room.players.length > 0;
  if (!hasHost && !hasPlayers) {
    rooms.delete(room.code);
  }
}

export function closeRoom(room: InternalRoom): void {
  for (const timer of room.disconnectTimers.values()) clearTimeout(timer);
  room.disconnectTimers.clear();
  rooms.delete(room.code);
}
