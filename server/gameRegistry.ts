import type { GameLibraryEntry } from "../src/platform/types.js";
import { QUICK_DRAW_ID, quickDrawController } from "./games/quickDraw.js";
import { TRIVIA_RUSH_ID, triviaRushController } from "./games/triviaRush.js";
import { COLOR_CLASH_ID, colorClashController } from "./games/colorClash.js";
import { FUSE_FRENZY_ID, fuseFrenzyController } from "./games/fuseFrenzy.js";

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
    id: COLOR_CLASH_ID,
    name: "Color Clash",
    description: "Match the ink colour, not the word. Fastest correct answer wins.",
    minPlayers: 2,
    maxPlayers: 8,
  },
  {
    id: FUSE_FRENZY_ID,
    name: "Fuse Frenzy",
    description: "Pass the bomb before the fuse runs out.",
    minPlayers: 3,
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
  typeof quickDrawController | typeof highForestController | typeof triviaRushController | typeof colorClashController | typeof fuseFrenzyController
> = {
  [QUICK_DRAW_ID]: quickDrawController,
  [HIGH_FOREST_ID]: highForestController,
  [TRIVIA_RUSH_ID]: triviaRushController,
  [COLOR_CLASH_ID]: colorClashController,
  [FUSE_FRENZY_ID]: fuseFrenzyController,
};
