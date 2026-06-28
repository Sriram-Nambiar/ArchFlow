import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  // Replace with your actual project reference from the Trigger.dev dashboard
  project: "proj_xxxxx",
  dirs: ["./trigger"],
  runtime: "node",
  logLevel: "info",
  maxDuration: 600,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
  build: {
    extensions: [
      prismaExtension({
        mode: "modern",
      }),
    ],
  },
});
