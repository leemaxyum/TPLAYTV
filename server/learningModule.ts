export type LearningSection = { id: string; title: string; theory: string; practice: string; solution: string };
export type LearningModule = { id: string; title: string; topic: string; description: string; sections: LearningSection[] };

const modules = new Map<string, LearningModule>();

function text(value: unknown, limit: number): string | null {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= limit ? value.trim() : null;
}

export function parseLearningModule(raw: unknown): LearningModule | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "A learning module must be an object." };
  const value = raw as Record<string, unknown>;
  const title = text(value.title, 120);
  const topic = text(value.topic, 100);
  const description = text(value.description, 500);
  if (!title || !topic || !description || !Array.isArray(value.sections) || value.sections.length < 1 || value.sections.length > 16) {
    return { error: "Add a title, topic, overview, and 1–16 lesson sections." };
  }
  const sections: LearningSection[] = [];
  for (const rawSection of value.sections) {
    if (!rawSection || typeof rawSection !== "object") return { error: "Each lesson section must be complete." };
    const section = rawSection as Record<string, unknown>;
    const sectionTitle = text(section.title, 140);
    const theory = text(section.theory, 4_000);
    const practice = text(section.practice, 1_200);
    const solution = text(section.solution, 4_000);
    if (!sectionTitle || !theory || !practice || !solution) return { error: "Every section needs theory, a practice prompt, and a worked solution." };
    sections.push({ id: crypto.randomUUID(), title: sectionTitle, theory, practice, solution });
  }
  return { id: crypto.randomUUID(), title, topic, description, sections };
}

export function loadLearningModule(roomCode: string, module: LearningModule): LearningModule {
  modules.set(roomCode, module);
  return module;
}

export function getLearningModule(roomCode: string): LearningModule | null { return modules.get(roomCode) ?? null; }
export function clearLearningModule(roomCode: string): void { modules.delete(roomCode); }

