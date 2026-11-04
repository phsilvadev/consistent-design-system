import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  skipProxyUrlNormalize: true,
  experimental: {
    authInterrupts: true,
    useTypeScriptCli: false,
    workerThreads: true,
    webpackBuildWorker: false,
  },
  async headers() {
    return [
      {
        source: "/:tenant/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};
export default config;
