import { networkInterfaces } from "node:os";

export function getLanIp() {
  for (const interfaceInfo of Object.values(networkInterfaces())) {
    if (interfaceInfo && interfaceInfo[0].address !== "127.0.0.1") {
      for (const info of interfaceInfo) {
        if (info.family === "IPv4") {
          return info.address;
        }
      }
    }
  }
}
