import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isWidget = mode === "widget";

  return {
    plugins: [react()],
    server: {
      allowedHosts: ["nonrhetorical-insuperably-jenise.ngrok-free.dev"],
      port: 5173,
    },
    build: isWidget
      ? {
          lib: {
            entry: "src/widget.jsx",
            name: "ChatWidget",
            fileName: "chat-widget",
            formats: ["iife"], // Standalone <script> build
          },
          rollupOptions: {
            output: {
              globals: {
                react: "React",
                "react-dom": "ReactDOM",
              },
            },
          },
        }
      : {
          outDir: "dist", // Normal React app build for Vercel
        },
  };
});
