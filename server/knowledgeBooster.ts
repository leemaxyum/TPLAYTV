export type KnowledgeQuestion = {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

export type KnowledgeSet = {
  version: 1;
  title: string;
  topic?: string;
  audience?: string;
  questions: KnowledgeQuestion[];
};

type BoosterPhase = "idle" | "question" | "reveal" | "complete";
type BoosterRoom = { set: KnowledgeSet; index: number; phase: BoosterPhase; answers: Map<string, number> };

const boosters = new Map<string, BoosterRoom>();

function asText(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max ? value.trim() : null;
}

export function parseKnowledgeSet(raw: unknown): KnowledgeSet | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "The import must be a JSON object." };
  const value = raw as Record<string, unknown>;
  const title = asText(value.title, 100);
  if (value.version !== 1 || !title || !Array.isArray(value.questions) || value.questions.length < 1 || value.questions.length > 24) {
    return { error: "Use version 1 with a title and 1–24 questions." };
  }
  const questions: KnowledgeQuestion[] = [];
  for (const entry of value.questions) {
    if (!entry || typeof entry !== "object") return { error: "Every question must be an object." };
    const question = entry as Record<string, unknown>;
    const id = asText(question.id, 80);
    const prompt = asText(question.prompt, 600);
    const explanation = asText(question.explanation, 600);
    const choices = Array.isArray(question.choices) ? question.choices.map((choice) => asText(choice, 180)) : [];
    if (!id || !prompt || !explanation || choices.length !== 4 || choices.some((choice) => !choice) || !Number.isInteger(question.correctIndex) || (question.correctIndex as number) < 0 || (question.correctIndex as number) > 3) {
      return { error: "Each question needs an id, prompt, four choices, correctIndex (0–3), and explanation." };
    }
    questions.push({ id, prompt, choices: choices as [string, string, string, string], correctIndex: question.correctIndex as number, explanation });
  }
  return { version: 1, title, topic: asText(value.topic, 80) ?? undefined, audience: asText(value.audience, 100) ?? undefined, questions };
}

export function importKnowledgeSet(roomCode: string, set: KnowledgeSet) {
  boosters.set(roomCode, { set, index: 0, phase: "idle", answers: new Map() });
  return getKnowledgeState(roomCode);
}

export function getKnowledgeState(roomCode: string) {
  const booster = boosters.get(roomCode);
  if (!booster) return { loaded: false };
  const question = booster.set.questions[booster.index];
  return {
    loaded: true,
    title: booster.set.title,
    topic: booster.set.topic,
    audience: booster.set.audience,
    questionIndex: booster.index,
    totalQuestions: booster.set.questions.length,
    phase: booster.phase,
    question: question ? { prompt: question.prompt, choices: question.choices } : null,
    responseCount: booster.answers.size,
    ...(booster.phase === "reveal" && question ? { correctIndex: question.correctIndex, explanation: question.explanation } : {}),
  };
}

export function startKnowledgeQuestion(roomCode: string) {
  const booster = boosters.get(roomCode);
  if (!booster || booster.phase === "complete") return getKnowledgeState(roomCode);
  booster.phase = "question";
  booster.answers.clear();
  return getKnowledgeState(roomCode);
}

export function submitKnowledgeAnswer(roomCode: string, playerId: string, choiceIndex: unknown): boolean {
  const booster = boosters.get(roomCode);
  if (!booster || booster.phase !== "question" || !Number.isInteger(choiceIndex) || (choiceIndex as number) < 0 || (choiceIndex as number) > 3 || booster.answers.has(playerId)) return false;
  booster.answers.set(playerId, choiceIndex as number);
  return true;
}

export function revealKnowledgeQuestion(roomCode: string) {
  const booster = boosters.get(roomCode);
  if (!booster || booster.phase !== "question") return getKnowledgeState(roomCode);
  booster.phase = "reveal";
  return getKnowledgeState(roomCode);
}

export function nextKnowledgeQuestion(roomCode: string) {
  const booster = boosters.get(roomCode);
  if (!booster || booster.phase !== "reveal") return getKnowledgeState(roomCode);
  if (booster.index >= booster.set.questions.length - 1) booster.phase = "complete";
  else {
    booster.index += 1;
    booster.phase = "question";
    booster.answers.clear();
  }
  return getKnowledgeState(roomCode);
}

export function clearKnowledgeBooster(roomCode: string) {
  boosters.delete(roomCode);
}

