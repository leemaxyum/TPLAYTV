# Fuse Frenzy Game Spec

**Status:** Building  
**Roadmap issue:** #4  
**Scope guard:** Uses the shared party platform only. High Forest Quest is not modified.

## Player promise
Pass the unstable bomb before it explodes in your hands.

## Players and match length
- 3-8 connected players
- Elimination match, one player eliminated per fuse
- 20-second first fuse; later fuses reduce to a 12-second floor
- Target duration: 2-3 minutes

## TV view
A single giant bomb holder card, a highly legible fuse countdown, remaining players, and an elimination reveal.

## Phone controls
One large `PASS` button. The current holder passes the bomb to a random eligible connected player; everyone else waits.

## Exact scoring
- Each surviving player gains 1 point whenever another player is eliminated.
- Final survivor gains 3 additional points.
- Match points are converted into the normal session leaderboard only when the match ends.

## Authoritative network state
- Server selects holder, fuse deadline, and next target.
- Server accepts `pass` only from the current holder, once per short pass cooldown.
- Server emits `fuse-turn`, `fuse-eliminated`, and normal `game:results`.
- Clients render state only.

## Disconnect behavior
- If the holder disconnects, server immediately transfers the bomb to a random eligible connected player.
- Other disconnected players are excluded from selection and may rejoin only after the match.
- If fewer than two eligible players remain due to disconnects, the server ends the match safely.

## Done criteria
- Starts with 3-8 players.
- Invalid non-holder passes have no effect.
- Fuse expiration eliminates exactly the holder.
- Holder disconnect transfers safely.
- Results, replay, return-to-library, and session reset work.
- High Forest Quest files remain untouched.

## Real-device playtest checklist
- [ ] Host plus three phones join on the same Wi-Fi
- [ ] Only the holder can pass
- [ ] Countdown remains in sync enough to understand the deadline
- [ ] Holder disconnect transfers the bomb
- [ ] An eliminated player cannot re-enter the match
- [ ] Results/replay/new-session work
