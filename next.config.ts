import path from "node:path";
import type { NextConfig } from "next";

// Pin the project root, so a package-lock.json in a parent folder (for example the user's home
// folder on a laptop) isn't mistaken for this project's workspace root.
const root = path.resolve(__dirname);

const nextConfig: NextConfig = {
  turbopack: { root },
  outputFileTracingRoot: root,
};

export default nextConfig;
