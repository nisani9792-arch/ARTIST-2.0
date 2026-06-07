import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@neondatabase/serverless", "postgres"],
};

export default nextConfig;
