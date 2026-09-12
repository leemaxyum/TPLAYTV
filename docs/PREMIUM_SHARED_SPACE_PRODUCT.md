# TPLAYTV: Premium Shared Space Product Direction

## Product promise

TPLAYTV is a local-first shared space for student groups: a host can run games, quizzes, classes, study rooms, and events on one shared screen while every participant has a useful phone interface.

The feeling is calm, intentional, and original—not an imitation of Apple, PlayStation, or any other brand. Premium means clear hierarchy, fewer but real actions, excellent empty states, and predictable feedback.

## Information architecture

### Home
A live, useful overview rather than a decorative dashboard:

- **Room pulse:** host status, active mode, connected player count, next activity
- **Today:** recent activity log, upcoming event/class, recently used spaces
- **Quick start:** start game, start quiz, open study room, schedule event
- **Host notes / softboard:** pinned announcements and session notes

### Games
A dedicated, filterable game library. Every card must state player count, session length, and whether it is ready. No fake “coming soon” card behaves as an action.

### People
The host’s participant management space:

- connected, disconnected, and invited people
- point total and current environment
- host can assign a participant to a game, quiz, study room, or lobby
- drag-and-drop is a host action with a keyboard-accessible equivalent; it never silently forces people into an activity

### Leaderboard
One points system with source labels:

- games
- quizzes / knowledge boosters
- participation / event awards
- current session and all-time views

### Settings
Only real controls: room identity, display theme, accessibility/motion, sound, phone invite policy, host permissions, and session reset. Hide settings that do nothing.

## Activity environments

A room can have multiple named environments at once:

- Lobby
- Game table
- Quiz table
- Study room
- Event / class stage

A participant sees their assigned environment on their phone. The host sees all environments on TV and can move people between them. v1 uses explicit host assignment; self-service joining is later.

## Knowledge boosters

A knowledge booster is a quiz or interactive course exercise. Import is a host-only workflow: paste structured question content, review it, then publish it to a quiz table.

The first release supports:
- topic title and course tag
- four-choice questions
- timed or untimed mode
- live results and points
- saved session recap

Do not build a general document canvas before the host can successfully import, run, and review one quiz.

## Phone participant app

A phone is a participant app, not merely a remote control:

- personal identity and room status
- current environment and host message
- context-specific controls (game, quiz, class reaction, study task)
- personal score and session history
- an understandable waiting/transition state

## Non-negotiable UX rules

1. Every visible button either works now or is explicitly unavailable with a reason.
2. The active room mode is always clear on TV and phone.
3. Do not use fake navigation. Home, Games, People, Leaderboard, and Settings must each render a distinct useful view.
4. TV is optimised for shared awareness; phones are optimised for personal action.
5. Empty states teach the next useful action.
6. Motion supports orientation, never decoration alone.

## Delivery sequence

1. **Shell polish:** functional Home/Games/People/Leaderboard/Settings views; remove fake nav behavior.
2. **Participant app polish:** phone home, personal status, score, environment, and waiting states.
3. **Room environments:** server-owned environment assignment and host management.
4. **Knowledge booster MVP:** quiz import/review/run/results.
5. **Class and event controls:** host announcements, agenda, reactions, attendance.
6. **Study tools:** softboard, tasks, notes, and course resources.

## Success metrics

- A new host understands the room’s current state in under five seconds.
- A participant can tell what they should do without asking the host.
- Every navigation section has at least one useful primary task.
- A host can run a quiz/class without disrupting people in another environment.
