import os from "node:os";
import process from "node:process";

export class LanHostGenerator {
  constructor() {}

  /**
   * @returns number|string. If no address is found, then returns 0
   */
  lanAddress(): string | number {
    let ips: number | string = 0;
    if (process.argv.includes("--host")) {
      const ifaces = os.networkInterfaces();
      Object.keys(ifaces).forEach((dev) => {
        //!Reevaluate why we are ignoring wsl especially if some services consume the APIs over there
        if (!dev.toLowerCase().includes("wsl")) {
          // Filter out WSL interfaces
          //@ts-expect-error: <ifaces maybe undefined>
          ifaces[dev].forEach((details: any) => {
            if (details.family === "IPv4" && !details.internal) {
              ips = details.address;
            }
          });
        }
      });
    }
    return ips;
  }
}
