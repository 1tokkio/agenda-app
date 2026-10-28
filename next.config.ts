import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* PGlite solo se usa en desarrollo: no debe empaquetarse. */
  serverExternalPackages: ["@electric-sql/pglite"],
  /* Las consultas (disponibilidad, agenda) son siempre en tiempo real. */
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
