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

export function clearStudyBoard(roomCode: string): void {
  boards.delete(roomCode);
}
