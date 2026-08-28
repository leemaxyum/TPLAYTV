import { networkInterfaces } from "node:os";

// Best-effort LAN IPv4 address. Falls back to localhost if none found
// (e.g. no network adapter), which still lets the PC itself work even
// though phones won't be able to join.
export function getLanIPv4(): string {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const addrs = interfaces[name] ?? [];
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  return "localhost";
}
