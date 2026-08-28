import type { GameLibraryEntry } from "../src/platform/types.js";
import { QUICK_DRAW_ID, quickDrawController } from "./games/quickDraw.js";

export const gameLibrary: GameLibraryEntry[] = [
  {
    id: QUICK_DRAW_ID,
    name: "Quick Draw",
    description: "Wait for GO, then tap first. Fastest reaction wins.",
    minPlayers: 1,
    maxPlayers: 8,
  },
];

export const controllerForGame: Record<string, typeof quickDrawController> = {
  [QUICK_DRAW_ID]: quickDrawController,
};
