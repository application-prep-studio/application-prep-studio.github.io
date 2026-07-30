import os from "node:os";

const originalNetworkInterfaces = os.networkInterfaces;

os.networkInterfaces = function networkInterfacesWithFallback() {
  try {
    return originalNetworkInterfaces();
  } catch {
    return {
      loopback: [
        {
          address: "127.0.0.1",
          netmask: "255.0.0.0",
          family: "IPv4",
          mac: "00:00:00:00:00:00",
          internal: true,
          cidr: "127.0.0.1/8",
        },
      ],
    };
  }
};
