# Fleavo

Fleavo is a local-first shared room for a TV or laptop host and the phones around it. It starts as a calm space for party games and student study sessions: open one room on the shared screen, let people join on the same Wi-Fi, then play, organise ideas, track tasks, or run a private course quiz.

No account, cloud database, or internet connection is required after dependencies are installed. Room, game, study-board, and quiz state live only in the host process and disappear when the room closes.

## What works today

- **Shared room:** QR-based joining, 2–8 players, reconnect grace period, host-loss handling, and session reset.
- **Games:** Quick Draw, Trivia Rush, Color Clash, Fuse Frenzy, and High Forest Quest.
- **Study Space:** host-owned Notes, Ideas, and Tasks board, live-synced to the room.
- **Knowledge Booster:** host imports a small course quiz as JSON; phones answer once privately; TV shows only aggregate progress until the host reveals the answer.

This is an early LAN product. A public class platform, cloud persistence, accounts, and permanent learner profiles are deliberately not included.

## Quick start

### Requirements

- Node.js 20 or newer
- A laptop/desktop and phones on the same non-isolated Wi-Fi network

```bash
npm install
npm run dev
```

The terminal prints two important addresses:

```text
Host (this PC): http://localhost:5173/tv/
LAN (for phones): http://192.168.x.x:5173/controller/
```

1. Open the **Host** address on the laptop or TV.
2. Wait for the room code and QR to appear.
3. Have each person scan the QR or open the LAN address on their phone.
4. Enter a name and join.
5. Use the host navigation to open Games or Study.

For a complete real-device check, follow [the playtest runbook](docs/REAL_DEVICE_PLAYTEST.md).

## Study Space and Knowledge Boosters

The host opens **Study** to add Notes, Ideas, or Tasks. Tasks can be completed from the host screen; every connected phone receives a quiet summary of the board.

For a course quiz, paste a version-1 JSON set into **Knowledge Booster** on the Study screen, then Load quiz → Start question → Reveal answer → Next question. Question import rules, a complete example, and a ready-to-use prompt for a course-content agent are in [the Knowledge Booster import contract](docs/KNOWLEDGE_BOOSTER_IMPORT.md).

## Hub Learn — solo study

Open `/hub/` for Fleavo's local-first solo learning space. It is independent from a host room and includes a searchable curriculum library, separate lesson reader, topic-matched flashcards and quizzes, browser-local completion/review data, and Pomodoro focus controls. The initial Programming Languages Library covers core language concepts plus Python, C++, JavaScript, and TypeScript foundations. See [the Hub Learn curriculum](docs/HUB_LEARN_CURRICULUM.md) for the live-content snapshot and the full planned learning map.

Privacy is intentional:

- A phone can submit one answer per question and receives only private confirmation.
- The TV sees an aggregate response count while a question is live.
- Correct answers and explanations appear only after the host reveals them.
- No public wrong-answer list, accuracy ranking, account, or learner profile is created.

## Development commands

```bash
npm run dev        # watch the shared Express + Socket.IO + Vite server
npm run typecheck  # TypeScript check without writing build output
npm run build      # production client bundle check
```

`npm run dev` is the local/LAN server. It is not a cloud deployment command; production hosting needs a public origin and deployment-specific configuration.

## Architecture

```text
TV host (/tv) ─────┐
                    ├── Socket.IO server ── room-owned in-memory state
Phone controllers ─┘        ├── games and scores
(/controller)               ├── Study Board
                            └── Knowledge Booster answers
```

The server is authoritative: clients never assign player IDs, scores, room membership, task state, or quiz outcomes. The [architecture guide](docs/ARCHITECTURE.md) explains the state boundaries and event rules.

## Repository map

```text
server/             Room server, game lifecycles, study and quiz state
tv/                 Host/TV interface
controller/         Phone interface
src/platform/       Shared room and game types
src/network/        Shared Socket.IO client setup
public/games/       Static game assets and High Forest Quest
docs/               Product, brand, architecture, import, and playtest guides
```

## LAN troubleshooting

- Use the LAN URL or QR code on phones—`localhost` only works on the host computer.
- Guest/campus Wi-Fi may isolate devices. Test on a home network or hotspot first.
- Some Android devices switch to mobile data when Wi-Fi has no internet. Disable mobile data or the “smart switch” feature while testing.
- If port 5173 is already in use, stop the old Fleavo server before starting another one.

## Product and contribution boundaries

- Keep High Forest Quest isolated unless changing it is explicitly part of the task.
- Do not add tracking, accounts, or public learner records without a deliberate product/privacy decision.
- New games must follow [the product roadmap’s spec and real-device gates](docs/PRODUCT_ROADMAP.md).
- Third-party game code/assets require a verified compatible license and a recorded notice before integration.

## Documentation

- [Product roadmap](docs/PRODUCT_ROADMAP.md)
- [Fleavo brand guide](docs/FLEAVO_BRAND_GUIDE.md)
- [Study Space MVP](docs/STUDY_SPACE_MVP.md)
- [Knowledge Booster import contract](docs/KNOWLEDGE_BOOSTER_IMPORT.md)
- [Architecture guide](docs/ARCHITECTURE.md)
- [Real-device playtest runbook](docs/REAL_DEVICE_PLAYTEST.md)


