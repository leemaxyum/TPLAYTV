# Fleavo Architecture

## Runtime shape

Fleavo runs one Node process. Express serves pages and static files, Vite supplies development middleware, and Socket.IO carries all room events over the same port.

```text
TV host        Phone controller(s)
   │                   │
   └──── Socket.IO ────┘
             │
       server/index.ts
             │
  roomStore · games · studyBoard · knowledgeBooster
```

## Authority boundaries

The server is the source of truth for room codes, player IDs, membership, scores, game lifecycle, Study Board state, quiz imports, answers, and reveal state. Browser code renders server events and requests actions; it must not calculate a result or fabricate state.

| Domain | Server-owned state | Client-visible state |
| --- | --- | --- |
| Room | members, reconnect status, scores, game phase | public player list and scores |
| Games | rules, timers, valid inputs, results | game stage and controller layout |
| Study Board | items, lane, task done state | all board items |
| Knowledge Booster | imported set, answer map, question phase | prompt/choices, aggregate response count; correct answer only during reveal |

## Room lifecycle

1. TV emits `room:create`; server assigns the room code and host role.
2. Phone emits `room:join`; server validates and assigns a player ID.
3. A reconnecting phone emits `player:reconnect` using its saved room/player pair.
4. Host can start games, edit Study Board items, or manage the Knowledge Booster.
5. Host disconnect clears the in-memory room, Study Board, and Knowledge Booster set.

## Knowledge Booster privacy model

`booster:answer` goes from one controller to the server. The server stores the choice by player ID and sends `booster:answer-status` only to that same socket. A successful answer triggers room-wide `booster:state`, but that state includes only `responseCount` while the question is active. `correctIndex` and `explanation` enter room state only after the host’s `booster:reveal` event.

This is privacy by protocol shape, not merely hidden CSS. Do not add per-player answer payloads to room-wide events.

## Local persistence and limits

Everything is in memory. Restarting the server clears rooms. Phone reconnect identity is stored in browser localStorage to allow a short Wi-Fi recovery, but it is not an account. Knowledge Booster imports accept 1–24 questions and a maximum 30 KB raw JSON payload to keep LAN rooms predictable.

## Extension rules

- Add new room-wide state to a focused server module, not arbitrary TV globals.
- Validate every incoming socket payload at the server boundary.
- Keep private information on socket-specific events; never rely on hidden UI for privacy.
- Add a real-device checklist before calling a game or shared-room feature shipped.

