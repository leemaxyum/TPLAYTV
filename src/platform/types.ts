// Minimal shared types. Keep small — do not add fields until a real
// feature (a game) needs them. See ARCHITECTURE.md section "Platform state".

export type RoomPhase = "lobby" | "playing" | "results";

export type PlayerState = {
  id: string;
  name: string;
  connected: boolean;
  ready: boolean;
  score: number;
};

export type RoomState = {
  code: string;
  phase: RoomPhase;
  gameId: string | null;
  players: PlayerState[];
};

export type RoomCreatedPayload = {
  code: string;
  controllerUrl: string;
};

export type RoomJoinedPayload = {
  code: string;
  playerId: string;
};

export type ServerErrorPayload = {
  code: string;
  message: string;
};

// --- Game SDK (small, conceptual — see GAME_SDK.md) -----------------------

export type ControllerDefinition = {
  type: "buttons" | "dpad";
  buttons: string[];
};

export type GameLibraryEntry = {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
};

export type GameStartedPayload = {
  gameId: string;
  controller: ControllerDefinition;
};

// Quick Draw specific game:state stages. Kept game-specific rather than
// generic, per "do not build a giant DSL" — a new game can define its own
// game:state shape.
export type QuickDrawStage =
  | { stage: "ready" }
  | { stage: "go"; goAt: number };

export type QuickDrawResult = {
  playerId: string;
  name: string;
  reactionMs: number | null; // null = never tapped
  falseStart: boolean;
};

export type GameResultsPayload = {
  gameId: string;
  rankings: QuickDrawResult[];
};

export type ControllerInputPayload = {
  action: string;
  sequence?: number;
};
