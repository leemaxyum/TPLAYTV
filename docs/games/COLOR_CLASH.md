# Color Clash Game Spec

**Status:** Building  
**Roadmap issue:** #3  
**Scope guard:** This game uses the shared TV, controller, and room platform only. It does not modify High Forest Quest.

## 1. Player promise

Spot the colour that matches the prompt faster than your friends and steal the round.

## 2. Players and round length

- 2-8 connected players
- 8 prompts per match
- Target duration: 60-90 seconds
- A prompt allows up to 5 seconds for answers, followed by a short reveal

## 3. TV view

The TV presents one oversized colour-word prompt, four labelled colour choices, a round counter, and a concise reveal showing the correct choice and the fastest correct players. The results screen uses the shared session-results flow.

## 4. Phone controls

Each phone shows four large buttons: red, blue, green, and yellow. The button label and colour are deliberately matched; the challenge is matching the prompt's *ink colour*, not reading the word.

## 5. Exact scoring

For each prompt:

- First correct connected player: 3 points
- Second correct connected player: 2 points
- Third and later correct connected players: 1 point
- Wrong answer or no answer: 0 points
- A player who is first correct for two consecutive prompts earns +1 bonus point on the second and every later consecutive first-place prompt.

A player can answer once per prompt. The server timestamps and orders every answer.

## 6. Authoritative network state

Server -> room:

- `game:started` with the four-button controller
- `game:state` with `question` (round, prompt word, ink colour, choices), `reveal` (correct colour and awarded players), and `game:results`
- `room:state` after score changes and final results

Phone -> server:

- `controller:input` with one allowed action: `red`, `blue`, `green`, or `yellow`

The server generates prompts, validates one answer per player, ranks answers by arrival order, awards points, and advances the match. Clients never calculate score.

## 7. Disconnect behavior

Disconnected players are excluded from the answer quorum immediately. If a player reconnects during a prompt, they may use the normal game controller but only participate in the next prompt; their score remains in the session. The prompt timer always ends a stalled prompt.

## 8. Done criteria

- Game appears in the library and starts only with 2-8 players.
- Eight prompts complete with server-authoritative scoring.
- Results and session replay/new-session controls work unchanged.
- Invalid or duplicate button events cannot add extra points.
- One controller disconnect cannot stall a prompt.
- High Forest files remain unchanged.

## 9. Real-device playtest checklist

- [ ] TV host + two phones join on the same Wi-Fi
- [ ] All four buttons answer the expected prompt
- [ ] First/second/later correct answers receive 3/2/1
- [ ] Wrong answer receives 0
- [ ] First-place streak bonus is visible in the session score
- [ ] Disconnect one player during a prompt; round still advances
- [ ] Reconnect that player and verify their prior score remains
- [ ] Replay, choose another game, and new session work from Results
