# Hub Learn Product Plan

Hub Learn is Fleavo's quiet, solo-learning product. It is not a host room, controller, live game, or class-management surface. Its promise: a learner can open one page, choose a small concept, practise it, and return later knowing what to review.

## Product principles

- Local first: lessons, progress, focus minutes, and review intervals work without an account.
- Explain before optimise: every module has a mental model, real use, retrieval prompt, worked solution, flashcard, and quiz.
- Calm by default: one next concept, no competitive pressure, no fake controls.
- Honest progression: completion means the learner chose it; later versions may add mastery evidence without rewriting history.

## Curriculum architecture

The curriculum map contains 120 sequenced topics across programming, discrete mathematics, algorithms/data structures, systems/web/data, mathematics/statistics, and AI/ML. Each track starts with foundations, then moves to applications and interview/problem-solving bridges.

Content is authored locally in `hub/catalog.ts`. Detailed study guides live in `TPLAYTV-hub-learn/output/pdf` during production and are verified visually before publication.

### Current shipped interaction slice

The shipped solo experience is deliberately narrower than the long-term platform plan:

- searchable curriculum library with separate lesson-reader pages;
- per-topic explanation, real-world application, retrieval practice, worked solution, flashcard, and quiz;
- local browser completion tracking and spaced-review intervals;
- 25/45/50 minute Pomodoro controls plus a draggable compact focus player;
- Programming Languages Library expanded through Python, C++, JavaScript, and TypeScript foundations.

The content count displayed in the UI must match the authored lessons in `hub/catalog.ts`. Do not label planned material as live content.

## Phases

### Now — offline foundation
- Original interactive lessons, flashcards, quizzes, Pomodoro, completion tracking, and spaced review.
- No account, backend, teacher controls, or dependency on a live room.
- Keep the Hub entry point at `/hub/`.

### Next — mastery and projects
- Add a learning-path selector: CS foundations, AI/ML foundations, and competitive-programming basics.
- Add small runnable challenges with deterministic local tests.
- Add a portfolio of three guided projects: CLI study tracker, API-backed data explorer, and simple ML classifier.
- Add mastery checks that require an explanation plus a new problem, not only a multiple-choice answer.

### Later — optional connected learning
- Opt-in sync and export; never make a local learner sign in just to study.
- Teacher-curated module imports and assigned paths can feed a learner's Hub Learn queue, but the solo workspace remains navigable alone.
- Aggregate progress only with clear consent; individual learning data is private by default.

## Boundaries

| Hub Learn | Fleavo rooms |
| --- | --- |
| Personal, quiet, asynchronous | Live, collaborative, host-managed |
| Learner chooses the path | Host assigns activities |
| Local browser progress | Room state is transient/shared |
| Study and reflection | Classes, quizzes, games, events |

## Definition of a strong first-year outcome

A learner should be able to write and debug small Python programs, describe complexity and core data structures, reason with basic proofs/probability/linear algebra, explain how web systems move data, evaluate a simple ML result, and independently solve progressively harder coding problems.

