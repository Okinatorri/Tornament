import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { lingui } from "@lingui/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
    base: "/",
    server: {
        host: true,
        port: 5173,
        allowedHosts: ["tempestcup.com"],
    },
    plugins: [
        react({
            babel: {
                plugins: ["@lingui/babel-plugin-lingui-macro"],
            },
        }),
        lingui(),
    ],
});
