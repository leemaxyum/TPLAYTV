import type { GameLibraryEntry } from "../src/platform/types.js";
import { QUICK_DRAW_ID, quickDrawController } from "./games/quickDraw.js";

export const HIGH_FOREST_ID = "high-forest-quest";
export const highForestController = {
  type: "dpad" as const,
  buttons: ["left", "right", "jump", "fire", "sprint", "grapple"],
};

export const gameLibrary: GameLibraryEntry[] = [
  {
    id: HIGH_FOREST_ID,
    name: "High Forest Quest",
    description: "A cooperative forest platform adventure. Use your phone as the controller.",
    minPlayers: 1,
    maxPlayers: 8,
  },
  {
    id: QUICK_DRAW_ID,
    name: "Quick Draw",
    description: "Wait for GO, then tap first. Fastest reaction wins.",
    minPlayers: 1,
    maxPlayers: 8,
  },
];

export const controllerForGame: Record<string, typeof quickDrawController | typeof highForestController> = {
  [QUICK_DRAW_ID]: quickDrawController,
  [HIGH_FOREST_ID]: highForestController,
};
