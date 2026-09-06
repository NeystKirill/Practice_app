import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,
  allowedDevOrigins: [
    "172.111.15.208",
    "172.17.0.1",
    "172.18.0.1",
    "172.19.0.1",
    "172.20.0.1",
    "172.21.0.1",
  ],
};

export default nextConfig;
