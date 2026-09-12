# Fleavo Education Platform Plan

## What is real now

Fleavo is still local-first. A teacher/host can run a room, save a Study Board in that host browser, build a quiz without JSON, author/save/share multi-section learning modules, and deliver private-answer Knowledge Boosters. A student can use a phone workspace to read the shared board and active module, reveal worked solutions, see their room profile, get help, and answer a live quiz.

The initial bundled library contains original first-year starter modules for Python Foundations, Algorithms and Data Structures, and Machine Learning Foundations. Each section pairs theory with retrieval practice and a worked solution. A student can self-host a private Fleavo room to work through these modules independently, or a teacher can share one with a group.

This is not yet a multi-school platform. There are no accounts, cloud classes, cross-device course libraries, or durable student records.

## Next platform model

### Teacher workspace

The teacher owns reusable **Course Modules**. A module groups a topic, learning objective, softboard/canvas blocks, tasks, and Knowledge Booster question sets. It is authored visually, saved to a teacher library, and can be opened into a live room.

### Student workspace

Each student sees only material assigned to them: room-wide notes plus their assigned tasks, learning modules, feedback, and optional private progress. “Drag a card onto a student” becomes an explicit assignment action that creates a server-owned assignment record; it cannot be only a visual drag effect.

### Softboard and canvas

- **Softboard:** ordered cards for text, links, images, short prompts, and resource attachments.
- **Canvas:** a collaborative visual surface. Build it as a separate document type with an operation log or CRDT before allowing concurrent editing; do not model it as a list of HTML snippets.

## Persistence stages

1. **Current:** host-browser Study Board backup; room state clears on host close.
2. **Local library:** versioned JSON/SQLite store on the host for teacher modules and reusable quiz sets.
3. **Identity:** teacher login, student display identity, and explicit class membership.
4. **Cloud sync:** encrypted service-side storage, permissions, backups, and conflict handling.

Do not skip directly from stage 1 to public cloud classes. Assignments and learner progress require identity, authorization, retention policy, and data-deletion controls.

## Learning-content roadmap

Start with original, open-licensed, or teacher-authored modules—never scrape/paywall-copy course content. The first catalog should be concise, editable building blocks for first-year CS / AI / ML:

- programming foundations: variables, control flow, functions, data structures, debugging
- Python and JavaScript practice
- discrete maths: logic, sets, relations, probability, vectors, matrices
- computer systems: binary, memory, operating systems, networks
- algorithms and data structures
- databases and SQL
- AI/ML foundations: data, train/test split, regression, classification, evaluation, ethics

Each module should declare learning objectives, estimated duration, prerequisites, source/license, practice activity, and a Knowledge Booster set. Points can reward participation and completed practice, but must not publicly rank wrong answers by default.

## Delivery milestones

1. Finish real-device validation of the student phone workspace, local module library, and teacher quiz builder.
2. Add explicit export/import for locally saved modules and expand the original/open-licensed course catalog.
3. Add assignment records and a student-specific board view.
4. Add Softboard cards and a teacher-present mode.
5. Design Canvas concurrency and permissions before implementation.
6. Only then decide whether accounts and cloud sync are worth the privacy and operations cost.


