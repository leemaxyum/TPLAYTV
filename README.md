# Stellar Play (Phase 1 + 3: rooms + Quick Draw)

TV-first local multiplayer party game platform. Rooms/joining (Phase 1) and
a first playable game, Quick Draw (Phase 3), are done. Phase 2's generic
controller foundation and Phases 4-7 (Color Clash, Crowd Dodge, polish)
are not built yet.

## Run

```
npm install
npm run dev
```

The terminal will print two URLs, e.g.:

```
Host (this PC):    http://localhost:5173/tv/
LAN (for phones):  http://192.168.1.42:5173/controller/
```

1. Open the **Host** URL on the PC (this is the "console" screen — mirror/cast
   this to a TV if you want).
2. Make sure your phone is on the **same Wi-Fi** as the PC.
3. Scan the QR code shown on the host screen, or type the LAN URL manually.
4. Enter a name and tap **JOIN**.
5. Your name appears live on the host screen.

Repeat with 2–8 phones.

6. On the host screen, click **Quick Draw** in the game library.
7. Phones get a big TAP button. Wait for READY, then GO — first valid tap
   per player wins.
8. Results (reaction time, or "false start" for early taps) show on the
   host and each phone.
9. Click **Back to library** to return and play again.

## Known limitations (expected at this stage)

- Only one game (Quick Draw) exists so far.
- Some campus/guest Wi-Fi networks isolate devices from each other (client
  isolation), which will block phones from reaching the PC. There's no
  workaround for this in v0.1 — use a normal home/hotspot network for now.
- Android phones: some (esp. Samsung) auto-switch from Wi-Fi to mobile data
  when a network looks like it has no internet, which breaks local
  connections. Turn off mobile data (or "Smart network switch" in Wi-Fi
  settings) while playing.
- Player list persists players in memory only; restarting the server clears
  all rooms.
- If a game mid-round is interrupted by a phone leaving, that player is
  simply excluded from the results — no crash, but no rejoin-mid-round yet.

## Project layout

```
stellar-play/
├─ server/           Express + Socket.IO + Vite (all one Node process)
├─ src/platform/      Shared types (RoomState, PlayerState)
├─ src/network/        Shared Socket.IO client helper
├─ tv/                /tv host page
├─ controller/        /controller phone page
```
