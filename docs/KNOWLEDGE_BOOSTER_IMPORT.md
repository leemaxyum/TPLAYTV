# Knowledge Booster Import Contract

## Purpose

Knowledge Boosters let a host run a calm, course-specific quiz in a Fleavo room. The host can load a small question set before the room opens. Players answer privately from their phones; the TV shows the prompt, timing, and aggregate progress — never a list of who got an answer wrong.

This is the import format for AI-assisted course content. It is intentionally small, readable, and local-first.

## Rules for good sets

- Keep one set to 5–12 questions and one topic.
- Use clear language suitable for the intended course level.
- Each multiple-choice question has exactly four choices and one correct answer.
- Avoid trick questions, personal data, and “gotcha” wording.
- Give a short explanation that is shown only when the host reveals the answer.
- Do not include copyrighted textbook passages beyond short necessary quotations.

## JSON shape

```json
{
  "version": 1,
  "title": "Cell Biology: Membranes",
  "topic": "Biology",
  "audience": "First-year undergraduate",
  "questions": [
    {
      "id": "membrane-001",
      "prompt": "Which molecule forms the basic double-layer of the cell membrane?",
      "choices": [
        "Phospholipids",
        "Nucleic acids",
        "Glycogen",
        "Triglycerides"
      ],
      "correctIndex": 0,
      "explanation": "Phospholipids arrange into a bilayer with water-facing heads and inward-facing tails."
    }
  ]
}
```

## Import prompt for a course-content agent

> Convert the following course material into a Fleavo Knowledge Booster JSON object. Follow version 1 exactly. Write 8 multiple-choice questions, each with four plausible options, one unambiguous correctIndex, and a concise explanation. Do not copy long source passages. Match the audience level and return JSON only.

## Privacy and room behaviour

- Question sets live with the host’s room, not a public Fleavo catalog.
- A player’s individual response is sent only to the server and acknowledged privately on that player’s phone.
- The TV receives the aggregate answer count while the question is live.
- Correct answers and explanations appear only when the host reveals them.
- No public wrong-answer list, accuracy ranking, or permanent learner profile is created.
- Closing the room clears the in-memory study board and imported quiz data.

## Implemented behaviour

The current LAN implementation validates a 1–24-question set, lets the host load it, start a question, see an aggregate response count, reveal the answer, and advance. Each phone can answer once per question and sees private confirmation. A real-device checklist is in `docs/REAL_DEVICE_PLAYTEST.md`.

