import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  transpilePackages: ["@crosswordxyz/react-crossword"],
  compiler: {
    styledComponents: true,
  },
  allowedDevOrigins: ["127.0.0.1", "localhost", "0.0.0.0"],
}

export default nextConfig
