# Study Space MVP

## What ships first
A host-owned, LAN-synced Study Board with three calm lanes:

- **Notes:** short host notes / softboard messages
- **Ideas:** unranked prompts and contributions
- **Tasks:** visible next steps with a done state

The TV shows the board. Phones show the participant's current room state; host board editing is deliberately TV/host-only for this first slice.

## Knowledge boosters
A host imports/reviews a version-1 multiple-choice JSON set, then runs a paced quiz with Load, Start, Reveal, and Next controls. Individual responses remain private; the TV shows the prompt and aggregate progress, never a public failure list. Import details live in `docs/KNOWLEDGE_BOOSTER_IMPORT.md`.

## Constraints
- local-first, one room, no account
- no public leaderboard by default
- no red wrong-answer state
- server owns shared board data
- High Forest Quest is untouched

