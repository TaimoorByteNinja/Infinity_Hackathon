import { existsSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
import { createApiApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";

/**
 * ONE port serves everything:
 *   /api/*  -> REST API
 *   /*      -> React frontend (Vite dev middleware in development, built files in production)
 */
async function main() {
  const app = createApiApp();
  const server = createHttpServer(app);

  if (env.isProduction) {
    const dist = resolve(env.frontendDir, "dist");
    if (!existsSync(dist)) throw new Error(`Frontend build not found at ${dist}. Run "npm run build" first.`);
    app.use(express.static(dist, { index: false, maxAge: "1h" }));
    app.get("*", (_req, res) => res.sendFile(resolve(dist, "index.html")));
  } else {
    // Load Vite from the FRONTEND's own dependencies so the dev server always matches
    // the version the frontend (and its plugins) were built for.
    const requireFromFrontend = createRequire(resolve(env.frontendDir, "package.json"));
    const vitePath = requireFromFrontend.resolve("vite");
    const { createServer } = (await import(pathToFileURL(vitePath).href)) as typeof import("vite");
    const vite = await createServer({
      root: env.frontendDir,
      configFile: resolve(env.frontendDir, "vite.config.ts"),
      // HMR websocket shares the same HTTP server => still ONE port in development
      server: { middlewareMode: true, hmr: { server } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  server.listen(env.port, () => {
    console.log(`NovaWorks CRM running on http://localhost:${env.port}  (${env.isProduction ? "production" : "development"})`);
    if (!env.ai.apiKey) console.warn("WARNING: AI_API_KEY is not set — transcript conversion will fail until it is.");
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\nPort ${env.port} is already in use — another copy of the app is probably running.`);
      console.error(`Stop it (Ctrl+C in its terminal, or: kill $(lsof -t -i:${env.port})) or set a different PORT in .env.\n`);
      process.exit(1);
    }
    throw err;
  });

  const shutdown = () => server.close(() => void prisma.$disconnect().then(() => process.exit(0)));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
