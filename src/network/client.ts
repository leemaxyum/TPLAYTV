import { io, Socket } from "socket.io-client";

// One shared connection helper. Games should NOT open their own sockets —
// they receive input through the platform. See ARCHITECTURE.md.
export function connectSocket(): Socket {
  // Connecting with no URL targets the same host/port that served this page,
  // which is what makes this work both on the PC (/tv) and on a phone
  // (/controller) reaching the PC's LAN IP.
  return io({
    transports: ["websocket", "polling"],
  });
}
