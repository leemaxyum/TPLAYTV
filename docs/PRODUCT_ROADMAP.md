# Fleavo Product Roadmap

## Product direction

Fleavo is an open-source, local-first shared room platform. One TV or laptop host runs the room; friends or students join with phones on the same Wi-Fi; a game, study board, or knowledge booster should begin in under 90 seconds.

The target feeling is premium, calm, and tactile: the clarity and restraint associated with great consumer hardware, without copying another company's UI, branding, assets, or trade dress.

## Product principles

1. **Instantly legible**: one main action per screen, large TV-safe type, no configuration maze.
2. **Phone as controller, TV as theatre**: the shared screen creates anticipation; phones make each player feel present.
3. **Server owns the truth**: scores, room membership, and match outcomes are authoritative on the host.
4. **Short games, strong replays**: 45-second to 3-minute rounds, quick rematches, variants that change decisions.
5. **Local first**: no account or cloud requirement for a game night.
6. **Polish is a feature**: transitions, sound, failure states, reconnects, and results should feel deliberate.

## Operating board

`Ideas -> Spec Ready -> Building -> Playtest -> Shipped`

- **Ideas**: a one-sentence pitch only. No implementation work.
- **Spec Ready**: the game spec below is complete and has a clear acceptance test.
- **Building**: one major game and one platform/polish task maximum.
- **Playtest**: tested on a TV/laptop plus at least two real phones on the same Wi-Fi.
- **Shipped**: rules, failures, and replay flow work in a real group.

## Required game spec

Every game enters **Spec Ready** only after answering:

1. One-sentence player promise
2. Number of players and round length
3. TV view
4. Phone controls
5. Exact scoring rule
6. Network events and authoritative state
7. Disconnect behavior
8. Done criteria
9. Real-device playtest checklist

## Release sequence

### Shipped: Party Loop Foundation

**Goal:** two to eight people can join, play multiple games, see results, and recover from ordinary failures.

- Enforce a game's player limits before start.
- Reject or explicitly queue mid-game joins; v0.2 rule: reject with `GAME_IN_PROGRESS`.
- End a room clearly if its host disconnects.
- Add replay and next-game actions from results.
- Keep a session leaderboard across games and add a host reset-session control.
- Move game lifecycle hooks toward `start`, `handleInput`, and `cancel` as new games are added. Do not build a generic engine before it is needed.

### Shipped: Color Clash

**Player promise:** Spot the right colour faster than your friends and steal the round.

- **Players / length:** 2-8 players; 8 rounds; 60-90 seconds.
- **TV:** one huge colour-word prompt, four colour choices, answer reveal, live round counter.
- **Phone:** four large colour buttons.
- **Scoring:** correct answers score 3, 2, 1 by arrival order; wrong answers score 0; quickest correct player gets a small streak multiplier after two consecutive wins.
- **Authority:** server chooses the prompt, records first answer, calculates score, and emits question/reveal/results state.
- **Disconnect:** disconnected players are excluded from the answer quorum; reconnecting players rejoin at the next round.
- **Done:** a complete 2-8 player session works on real phones, including one disconnect/reconnect test.

### Shipped: Fuse Frenzy

**Player promise:** Pass the unstable bomb before it explodes in your hands.

- **Players / length:** 3-8 players; 2-3 minutes.
- **TV:** current holder, shrinking fuse, round tension, elimination order.
- **Phone:** one large PASS button; optional risk button later.
- **Scoring:** surviving a round earns points; last player standing earns the most.
- **Authority:** server owns the holder, fuse deadline, pass validity, and eliminations.
- **Disconnect:** if the holder disconnects, server immediately passes to a connected random player and announces it.
- **Why now:** small state machine, strong room energy, reusable timer/reconnect lessons.

### Spike: Crowd Dodge

**Player promise:** Survive a shared arena while your friends turn it into chaos.

- **Players / length:** 2-8 players; 60-120 seconds.
- **TV:** one avatar per phone, hazards, eliminations, winner spotlight.
- **Phone:** directional pad with a single ability button.
- **Scoring:** survival time plus placement points.
- **Authority:** server is the source of movement/collision truth; clients render snapshots.
- **Disconnect:** avatar becomes inactive, can rejoin only between rounds.
- **Gate:** build only after Color Clash proves the party loop and a small server-tick prototype proves the feel.

## High Forest Quest position

High Forest Quest is a phone-controlled TV adventure prototype, not yet a proven 2-8-player party game. Keep it in the library only when its player count, shared-screen rules, and session end state match what the description promises. It should not dictate the architecture of short competitive party games.

## License-safe integration policy

Fast integration is encouraged; untracked copying is not.

1. Only intake code under MIT, Apache-2.0, ISC, BSD, or CC0 after verifying the repository's current license.
2. Record source URL, license, author, imported files, changes, and required notices in `THIRD_PARTY_NOTICES.md`.
3. Keep third-party code isolated under `vendor/` or a clearly attributed module until it is understood.
4. Do not reuse assets from a code example unless their asset license explicitly permits it. Official Phaser examples are MIT for code, but their assets are not generally reusable.
5. Adapt mechanics and algorithms into Fleavo's server-authoritative protocol; do not embed an unrelated full app inside the product.
6. Every imported game still passes the same real-device and disconnect checklist.

## Candidate reuse sources

- **Official Phaser examples**: MIT source code; useful for focused rendering, input, and physics patterns. Verify every asset separately.
- **GameNight**: MIT; useful as an architectural reference for self-hosted Socket.IO party-game flows. Extract only well-understood game logic and preserve notice.
- **GameNest**: Apache-2.0; useful as a reference for LAN party catalog and game lifecycle ideas. Do not copy a large game wholesale before isolating its dependencies and notices.

## Quality gates

A feature does not ship because it looks good in one browser tab. It ships when:

- The room starts from a fresh host page.
- Two real phones can join via QR code on the same Wi-Fi.
- Invalid room, duplicate name, room-full, host-loss, and one player disconnect are understandable.
- A full round reaches results without manual refresh.
- The host can start the next game or reset the session.
- No secret, API key, or private network detail enters the repository.

## Shipped: Student Study Space MVP

**Player promise:** A room can capture the next useful thought and run a course quiz without exposing who got something wrong.

- Host-owned Notes, Ideas, and Tasks board is LAN-synced in real time.
- Knowledge Booster imports a small version-1 JSON question set, then supports host load/start/reveal/next.
- Phones answer once per question and get private confirmation.
- TV shows aggregate response count before reveal; no public wrong-answer state or learner profile is created.
- See `docs/STUDY_SPACE_MVP.md`, `docs/KNOWLEDGE_BOOSTER_IMPORT.md`, and `docs/REAL_DEVICE_PLAYTEST.md` for implementation and test gates.

