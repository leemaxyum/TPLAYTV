# Party Game Real-Device Playtest Runbook

Run this on one laptop/TV host and phones on the same Wi-Fi. Record date, player count, device/browser, and any failure in the linked GitHub issue.

## Setup
1. Start the host and open `/tv/`.
2. Join every phone using the QR code.
3. Confirm every player appears once in the TV list.

## Color Clash
- Use 2+ phones; complete all eight rounds.
- Verify 3/2/1 arrival-order scoring and first-place streak bonus.
- Disconnect and reconnect one phone during a prompt; the round must still advance and the player score must persist.
- Test replay, another game, and new session.

## Fuse Frenzy
- Use 3+ phones; verify non-holders cannot pass.
- Disconnect the holder; bomb must transfer to an eligible connected player.
- Finish a match and verify results/replay/new session.

## Crowd Dodge spike
- Use 2-4 phones and record subjective input latency and visual smoothness.
- Confirm each phone controls only its own avatar.
- Disconnect one phone; its avatar must stop colliding immediately.
- Record the smallest acceptable snapshot rate and observed Wi-Fi conditions.

Do not mark a game shipped solely from simulated clients; link the run result to its issue.
