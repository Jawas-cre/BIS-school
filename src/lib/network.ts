import "server-only";
import os from "node:os";
import { headers } from "next/headers";

// Adapters that aren't the computer's Wi-Fi or cable connection: virtual machines, WSL, Docker, VPNs.
const VIRTUAL = /vEthernet|Hyper-V|WSL|VirtualBox|VMware|docker|br-|veth|Loopback|utun|awdl|llw|tailscale|zerotier/i;

/** This computer's addresses on the local network, the most likely home or office Wi-Fi first. */
function lanAddresses() {
  const found: string[] = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    if (VIRTUAL.test(name)) continue;
    for (const a of list ?? []) if (a.family === "IPv4" && !a.internal && !a.address.startsWith("169.254.")) found.push(a.address);
  }
  const rank = (ip: string) => (ip.startsWith("192.168.") ? 0 : ip.startsWith("10.") ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : 3);
  return found.sort((a, b) => rank(a) - rank(b));
}

/**
 * The address phones on the same Wi-Fi can open, when the site runs on this computer through the
 * start-here launcher. Null when it runs elsewhere (e.g. online), where the normal address works.
 */
export async function phoneAddress() {
  if (process.env.BIS_LAUNCHER !== "1") return null;
  const host = (await headers()).get("host") ?? "";
  const port = host.match(/:(\d+)$/)?.[1] ?? process.env.PORT ?? "3000";
  const [ip] = lanAddresses();
  return ip ? `http://${ip}:${port}` : null;
}
