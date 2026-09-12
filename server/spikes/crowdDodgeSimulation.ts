// Crowd Dodge is deliberately a spike, not a production game. This module
// proves the server owns movement, bounds, hazards, and snapshots.
export const CROWD_DODGE_TICK_MS = 1000 / 30;
export const CROWD_DODGE_SNAPSHOT_MS = 1000 / 15;
export const CROWD_DODGE_ARENA = { width: 960, height: 540 };
export const CROWD_DODGE_PLAYER_RADIUS = 18;

export type CrowdDodgeInput = { up: boolean; down: boolean; left: boolean; right: boolean };
export type CrowdDodgeAvatar = {
  playerId: string;
  x: number;
  y: number;
  alive: boolean;
  input: CrowdDodgeInput;
};

export type CrowdDodgeSnapshot = {
  tick: number;
  avatars: Array<Pick<CrowdDodgeAvatar, "playerId" | "x" | "y" | "alive">>;
  hazard: { x: number; y: number; radius: number };
};

const SPEED_PER_TICK = 7;
const HAZARD_RADIUS = 28;

export class CrowdDodgeSimulation {
  private tick = 0;
  private avatars = new Map<string, CrowdDodgeAvatar>();

  addPlayer(playerId: string, slot: number): void {
    this.avatars.set(playerId, {
      playerId,
      x: 140 + (slot % 4) * 220,
      y: 100 + Math.floor(slot / 4) * 300,
      alive: true,
      input: { up: false, down: false, left: false, right: false },
    });
  }

  removePlayer(playerId: string): void {
    const avatar = this.avatars.get(playerId);
    if (!avatar) return;
    avatar.alive = false;
    avatar.input = { up: false, down: false, left: false, right: false };
  }

  setInput(playerId: string, input: CrowdDodgeInput): void {
    const avatar = this.avatars.get(playerId);
    if (!avatar || !avatar.alive) return;
    avatar.input = input;
  }

  step(): CrowdDodgeSnapshot {
    this.tick += 1;
    const hazard = this.hazardAt(this.tick);
    for (const avatar of this.avatars.values()) {
      if (!avatar.alive) continue;
      avatar.x += (Number(avatar.input.right) - Number(avatar.input.left)) * SPEED_PER_TICK;
      avatar.y += (Number(avatar.input.down) - Number(avatar.input.up)) * SPEED_PER_TICK;
      avatar.x = clamp(avatar.x, CROWD_DODGE_PLAYER_RADIUS, CROWD_DODGE_ARENA.width - CROWD_DODGE_PLAYER_RADIUS);
      avatar.y = clamp(avatar.y, CROWD_DODGE_PLAYER_RADIUS, CROWD_DODGE_ARENA.height - CROWD_DODGE_PLAYER_RADIUS);
      if (Math.hypot(avatar.x - hazard.x, avatar.y - hazard.y) <= CROWD_DODGE_PLAYER_RADIUS + hazard.radius) {
        avatar.alive = false;
      }
    }
    return {
      tick: this.tick,
      avatars: [...this.avatars.values()].map(({ playerId, x, y, alive }) => ({ playerId, x, y, alive })),
      hazard,
    };
  }

  private hazardAt(tick: number) {
    const phase = tick / 30;
    return {
      x: 480 + Math.sin(phase * 1.35) * 340,
      y: 270 + Math.cos(phase * 0.9) * 170,
      radius: HAZARD_RADIUS,
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
