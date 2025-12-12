import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@notes/types", "@notes/ui-lib"],
};

export default nextConfig;
