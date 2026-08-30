import type { GameLibraryEntry } from "../src/platform/types.js";
import { QUICK_DRAW_ID, quickDrawController } from "./games/quickDraw.js";
import { TRIVIA_RUSH_ID, triviaRushController } from "./games/triviaRush.js";

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
  {
    id: TRIVIA_RUSH_ID,
    name: "Trivia Rush",
    description: "Fast multiple-choice rounds. Answer first and correctly to score big.",
    minPlayers: 1,
    maxPlayers: 8,
  },
];

export const controllerForGame: Record<
  string,
  typeof quickDrawController | typeof highForestController | typeof triviaRushController
> = {
  [QUICK_DRAW_ID]: quickDrawController,
  [HIGH_FOREST_ID]: highForestController,
  [TRIVIA_RUSH_ID]: triviaRushController,
};
