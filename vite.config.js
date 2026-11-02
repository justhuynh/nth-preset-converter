import https from "node:https";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const UPSTREAM_HOST = "103.101.163.27";
const UPSTREAM_PORT = 8443;
const UPSTREAM_ORIGIN = `https://${UPSTREAM_HOST}:${UPSTREAM_PORT}`;
const SPOOF_ORIGIN = "https://nth-qrcode-converter.pages.dev";

const upstreamAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

const proxyEntry = {
  target: UPSTREAM_ORIGIN,
  changeOrigin: true,
  secure: false,
  agent: upstreamAgent,
  timeout: 120000,
  proxyTimeout: 120000,
  headers: {
    Origin: SPOOF_ORIGIN,
    Referer: `${SPOOF_ORIGIN}/`,
  },
};

const proxyConfig = {
  "/api/results": proxyEntry,
  "/api": proxyEntry,
  "/f": proxyEntry,
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    minify: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react")) {
            return "react-vendor";
          }
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
    proxy: proxyConfig,
  },
  preview: {
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
    proxy: proxyConfig,
  },
});
