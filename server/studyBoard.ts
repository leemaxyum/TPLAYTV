export type StudyBoardItem = {
  id: string;
  lane: "notes" | "ideas" | "tasks";
  text: string;
  done: boolean;
};

export type StudyBoardState = { items: StudyBoardItem[] };

const boards = new Map<string, StudyBoardState>();

export function getStudyBoard(roomCode: string): StudyBoardState {
  return boards.get(roomCode) ?? { items: [] };
}

export function addStudyBoardItem(roomCode: string, lane: StudyBoardItem["lane"], text: string): StudyBoardState {
  const board = getStudyBoard(roomCode);
  const item: StudyBoardItem = { id: crypto.randomUUID(), lane, text: text.trim().slice(0, 280), done: false };
  const next = { items: [...board.items, item] };
  boards.set(roomCode, next);
  return next;
}

export function toggleStudyBoardTask(roomCode: string, itemId: string): StudyBoardState {
  const board = getStudyBoard(roomCode);
  const next = { items: board.items.map((item) => item.id === itemId && item.lane === "tasks" ? { ...item, done: !item.done } : item) };
  boards.set(roomCode, next);
  return next;
}

export function deleteStudyBoardItem(roomCode: string, itemId: string): StudyBoardState {
  const board = getStudyBoard(roomCode);
  const next = { items: board.items.filter((item) => item.id !== itemId) };
  boards.set(roomCode, next);
  return next;
}

export function replaceStudyBoard(roomCode: string, rawItems: unknown): StudyBoardState {
  if (!Array.isArray(rawItems)) return getStudyBoard(roomCode);
  const items: StudyBoardItem[] = [];
  for (const raw of rawItems.slice(0, 200)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const lane = item.lane;
    const text = typeof item.text === "string" ? item.text.trim().slice(0, 280) : "";
    if (!(lane === "notes" || lane === "ideas" || lane === "tasks") || !text) continue;
    items.push({ id: crypto.randomUUID(), lane, text, done: lane === "tasks" && item.done === true });
  }
  const next = { items };
  boards.set(roomCode, next);
  return next;
}

export function clearStudyBoard(roomCode: string): void {
  boards.delete(roomCode);
}

