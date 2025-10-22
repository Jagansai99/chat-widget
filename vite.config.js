import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Local dev server config (your ngrok setup is fine)
  server: {
    allowedHosts: ["nonrhetorical-insuperably-jenise.ngrok-free.dev"],
    port: 5173,
  },

  // 👇 This section enables a "build" specifically for widget.js
  // build: {
  //   lib: {
  //     entry: "src/widget.jsx",   // your entry file for widget
  //     name: "ChatWidget",
  //     fileName: "chat-widget",
  //     formats: ["iife"],        // single file, browser-ready
  //   },
  //   rollupOptions: {
  //     output: {
  //       globals: {
  //         react: "React",
  //         "react-dom": "ReactDOM",
  //       },
  //     },
  //   },
  // },
      build: {
    outDir: "dist",
  },
});
