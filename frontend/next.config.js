const path = require("path");
const { loadEnvConfig } = require("@next/env");

// Carga variables desde el archivo .env único en la raíz del proyecto
// (Next.js expone al cliente únicamente las que llevan prefijo NEXT_PUBLIC_*)
loadEnvConfig(path.resolve(__dirname, ".."));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    // Evita bloqueos de archivos de OneDrive en Windows sobre .next/cache
    if (dev) {
      config.cache = {
        type: "memory",
      };
    }
    if (!isServer) {
      config.output = {
        ...config.output,
        chunkLoadTimeout: 60000,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
