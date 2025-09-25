import os from "node:os";

const addresses = new Array<string>();
const ifaces = os.networkInterfaces();
for (const k of Object.keys(ifaces)) {
  const v = ifaces[k]!;
    for (const details of v) {
      if (details.family === "IPv4" && !details.internal) {
        addresses.push(details.address);
      }
  }
}

export {addresses}