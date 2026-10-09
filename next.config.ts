import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The public dashboard reads live database state, so it is rendered
  // dynamically rather than through the Cache Components model.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
