# Crowd Dodge Server-Tick Spike

**Status:** Building spike  
**Roadmap issue:** #5  
**Scope guard:** No High Forest Quest files or mechanics are used.

## Question to answer
Can a server-authoritative 2-4 player arena feel responsive enough on local Wi-Fi with directional phone input and periodic state snapshots?

## Minimal prototype
- Arena: 960 × 540 virtual units
- Players: 2-4 coloured circles
- Input: up/down/left/right pressed state from each phone
- Server tick: 30 Hz simulation
- Snapshot: 15 Hz room broadcast
- Collision: server clamps arena bounds and detects hazard overlap
- Hazard: one deterministic moving obstacle
- Disconnect: avatar freezes and becomes non-collidable immediately

## Success evidence
- [ ] Two to four real phones connect through a TV host
- [ ] Inputs stay understandable at normal local Wi-Fi latency
- [ ] Snapshot rate has no obvious visual stutter on TV
- [ ] Two clients cannot move the same avatar
- [ ] Disconnect immediately removes collision risk
- [ ] Measured latency and observations recorded in issue #5

## Non-goals
No scoring system, art pipeline, matchmaking, progression, or full Crowd Dodge production UI until this spike passes on real devices.
