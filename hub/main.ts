import { hubTracks, type HubTopic } from "./catalog";

const views = {
  today: document.getElementById("today-view")!,
  library: document.getElementById("library-view")!,
  review: document.getElementById("review-view")!,
};
const STORAGE = "fleavo:hub-learn:v1";
type ReviewRecord = { intervalDays: number; dueAt: string; lastReviewedAt: string };
type Progress = { completed: string[]; focusMinutes: number; lastFocusDate?: string; flashcardIndex: number; quizIndex: number; reviews: Record<string, ReviewRecord> };
let progress: Progress = loadProgress();
let activeTopic: HubTopic = hubTracks[0].topics[0];
let timer: ReturnType<typeof setInterval> | null = null;
let remainingSeconds = 25 * 60;

function loadProgress(): Progress { try { return { completed: [], focusMinutes: 0, flashcardIndex: 0, quizIndex: 0, reviews: {}, ...JSON.parse(localStorage.getItem(STORAGE) ?? "{}") }; } catch { return { completed: [], focusMinutes: 0, flashcardIndex: 0, quizIndex: 0, reviews: {} }; } }
function saveProgress() { localStorage.setItem(STORAGE, JSON.stringify(progress)); }
function allTopics() { return hubTracks.flatMap((track) => track.topics); }

function showView(view: keyof typeof views) {
  Object.entries(views).forEach(([name, element]) => element.classList.toggle("hidden", name !== view));
  document.querySelectorAll<HTMLButtonElement>(".hub-nav").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
}
document.querySelectorAll<HTMLButtonElement>(".hub-nav").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view as keyof typeof views)));

const focusTitle = document.getElementById("focus-title")!;
const focusLabel = document.getElementById("focus-label")!;
const minutesSelect = document.getElementById("focus-minutes") as HTMLSelectElement;
function renderTimer() { focusTitle.textContent = `${Math.floor(remainingSeconds / 60).toString().padStart(2, "0")}:${(remainingSeconds % 60).toString().padStart(2, "0")}`; }
function resetTimer() { if (timer) clearInterval(timer); timer = null; remainingSeconds = Number(minutesSelect.value) * 60; renderTimer(); document.getElementById("focus-start")!.textContent = "Start focus"; focusLabel.textContent = "Choose a topic, then begin a calm focus block."; }
document.getElementById("focus-start")!.addEventListener("click", () => {
  const button = document.getElementById("focus-start")!;
  if (timer) { clearInterval(timer); timer = null; button.textContent = "Resume focus"; focusLabel.textContent = "Paused. One breath, then continue when ready."; return; }
  button.textContent = "Pause"; focusLabel.textContent = `Working on ${activeTopic.title}. Keep the next step small.`;
  timer = setInterval(() => { remainingSeconds--; renderTimer(); if (remainingSeconds <= 0) { clearInterval(timer!); timer = null; progress.focusMinutes += Number(minutesSelect.value); progress.lastFocusDate = new Date().toDateString(); saveProgress(); focusLabel.textContent = "Focus block complete. Write one thing you can now explain."; button.textContent = "Start another"; renderToday(); } }, 1000);
});
document.getElementById("focus-reset")!.addEventListener("click", resetTimer);
minutesSelect.addEventListener("change", resetTimer);

function renderToday() {
  const next = allTopics().find((topic) => !progress.completed.includes(topic.id)) ?? allTopics()[0];
  document.getElementById("next-title")!.textContent = next.title;
  document.getElementById("next-copy")!.textContent = next.summary;
  document.getElementById("progress-count")!.textContent = String(progress.completed.length);
  document.getElementById("streak-copy")!.textContent = progress.focusMinutes ? `${progress.focusMinutes} focused minute${progress.focusMinutes === 1 ? "" : "s"} logged locally.` : "Your first focused block starts a streak.";
  (document.getElementById("open-next") as HTMLButtonElement).onclick = () => { activeTopic = next; showView("library"); renderLibrary(); renderLesson(next); };
}

const trackList = document.getElementById("track-list")!;
const lessonPanel = document.getElementById("lesson-panel")!;
function renderLibrary(filter = "") {
  trackList.innerHTML = "";
  const query = filter.toLowerCase().trim();
  hubTracks.forEach((track) => {
    const shown = track.topics.filter((topic) => !query || `${track.title} ${topic.title} ${topic.summary}`.toLowerCase().includes(query));
    if (!shown.length) return;
    const section = document.createElement("section"); section.className = "track";
    section.innerHTML = `<div class="track-heading"><div><p>${track.topicCount} curriculum topics</p><h2>${track.title}</h2><span>${track.description}</span></div></div>`;
    const cards = document.createElement("div"); cards.className = "topic-cards";
    shown.forEach((topic) => { const card = document.createElement("button"); card.className = `topic-card ${progress.completed.includes(topic.id) ? "complete" : ""}`; card.innerHTML = `<strong>${topic.title}</strong><span>${topic.summary}</span><em>${progress.completed.includes(topic.id) ? "Completed" : "Open lesson"}</em>`; card.addEventListener("click", () => { activeTopic = topic; renderLesson(topic); }); cards.appendChild(card); });
    section.appendChild(cards); trackList.appendChild(section);
  });
}

function renderLesson(topic: HubTopic) {
  lessonPanel.classList.remove("hidden");
  const completed = progress.completed.includes(topic.id);
  lessonPanel.innerHTML = `<p class="eyebrow">Deep lesson</p><h2>${topic.title}</h2><p class="lesson-summary">${topic.summary}</p><section><h3>Learn it</h3><p>${topic.learn}</p></section><section class="application"><h3>Real-world use</h3><p>${topic.realWorld}</p></section><section><h3>Try from memory</h3><p>${topic.practice}</p><details><summary>Show worked solution</summary><p>${topic.solution}</p></details></section>`;
  const actions = document.createElement("div"); actions.className = "lesson-actions";
  const focus = document.createElement("button"); focus.textContent = "Focus on this"; focus.addEventListener("click", () => { showView("today"); focusLabel.textContent = `Ready for ${topic.title}. Start when you are ready.`; }); actions.appendChild(focus);
  const complete = document.createElement("button"); complete.className = "quiet"; complete.textContent = completed ? "Mark not done" : "Mark complete"; complete.addEventListener("click", () => { progress.completed = completed ? progress.completed.filter((id) => id !== topic.id) : [...progress.completed, topic.id]; saveProgress(); renderToday(); renderLibrary((document.getElementById("library-search") as HTMLInputElement).value); renderLesson(topic); }); actions.appendChild(complete); lessonPanel.appendChild(actions);
}
document.getElementById("library-search")!.addEventListener("input", (event) => renderLibrary((event.target as HTMLInputElement).value));

function dueTopics() { const now = Date.now(); return allTopics().filter((topic) => { const review = progress.reviews[topic.id]; return !review || Date.parse(review.dueAt) <= now; }); }
function renderReview() {
  const topics = allTopics(); const due = dueTopics(); const card = due[0] ?? topics[progress.flashcardIndex % topics.length];
  document.getElementById("review-status")!.textContent = due.length ? `${due.length} concept${due.length === 1 ? "" : "s"} ready for review today.` : "You are caught up. Explore a card to keep the habit warm.";
  document.getElementById("flashcard-topic")!.textContent = card.title;
  document.getElementById("flashcard-question")!.textContent = card.flashcard.question;
  const answer = document.getElementById("flashcard-answer")!; answer.textContent = card.flashcard.answer; answer.classList.add("hidden");
  document.getElementById("flashcard-reveal")!.textContent = "Reveal";
  const quiz = topics[progress.quizIndex % topics.length]; document.getElementById("quiz-question")!.textContent = quiz.quiz.question;
  const options = document.getElementById("quiz-options")!; options.innerHTML = ""; document.getElementById("quiz-feedback")!.textContent = "";
  quiz.quiz.options.forEach((option, index) => { const button = document.createElement("button"); button.textContent = option; button.addEventListener("click", () => { options.querySelectorAll("button").forEach((other) => (other as HTMLButtonElement).disabled = true); button.classList.add(index === quiz.quiz.correct ? "correct" : "incorrect"); document.getElementById("quiz-feedback")!.textContent = index === quiz.quiz.correct ? `Correct. ${quiz.quiz.explanation}` : `Not quite. ${quiz.quiz.explanation}`; }); options.appendChild(button); });
}
document.getElementById("flashcard-reveal")!.addEventListener("click", () => { document.getElementById("flashcard-answer")!.classList.remove("hidden"); document.getElementById("flashcard-reveal")!.textContent = "Answer shown"; });
function scheduleReview(days: number) {
  const topics = allTopics(); const due = dueTopics(); const card = due[0] ?? topics[progress.flashcardIndex % topics.length];
  const previous = progress.reviews[card.id]; const intervalDays = days === 1 ? 1 : Math.min(21, Math.max(3, (previous?.intervalDays ?? 1) * 2));
  progress.reviews[card.id] = { intervalDays, dueAt: new Date(Date.now() + intervalDays * 86_400_000).toISOString(), lastReviewedAt: new Date().toISOString() };
  progress.flashcardIndex++; progress.quizIndex++; saveProgress(); renderReview();
}
document.getElementById("flashcard-again")!.addEventListener("click", () => scheduleReview(1));
document.getElementById("flashcard-easy")!.addEventListener("click", () => scheduleReview(3));

renderTimer(); renderToday(); renderLibrary(); renderReview();


