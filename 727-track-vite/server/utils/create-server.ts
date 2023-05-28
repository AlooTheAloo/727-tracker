import fs from "fs";
import express from "express";
import { ViteDevServer } from "vite";
import { fromRoot } from "./utils.js";
import { initialise_google_services } from "../Google/google-profile-helper.js";
import http from "http";
import { Server } from "socket.io";
import { createSocketServer } from "../sockets/index.js";
import { Log } from "./logging.js";

const isTest = process.env.VITEST;

const root = process.cwd();
const isProd = process.env.NODE_ENV === "production";
const resolve = (p: string) => fromRoot(p);

const indexProd = isProd
  ? fs.readFileSync(resolve("dist/client/index.html"), "utf-8")
  : "";
/**
 * @type {import('vite').ViteDevServer}
 */
let vite: ViteDevServer;

/**
 * Crée le serveur qui s'occupe du SSR
 * @param hmrPort port utilisé pour le débugging vite
 * @returns l'objet "app" express
 */
export async function createServer(hmrPort: number) {
  const app = express();

  if (!isProd) {
    vite = await (
      await import("vite")
    ).createServer({
      root,
      logLevel: isTest ? "error" : "info",
      server: {
        middlewareMode: true,
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100,
        },
        hmr: {
          port: hmrPort,
        },
      },
      appType: "custom",
    });
    // use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    app.use((await import("compression")).default());
    app.use(
      (await import("serve-static")).default(resolve("dist/client"), {
        index: false,
      })
    );
  }
  return { app };
}

/**
 * Envoie le HTML demandé au client
 * @param req La requête express du client
 * @param res La réponse express à utiliser pour envoyer le fichier
 */
export async function sendHtml(req: express.Request, res: express.Response) {
  try {
    const url = req.originalUrl;
    let template: string, render;
    if (!isProd) {
      // always read fresh template in dev
      Log("Starting SSR process");
      template = fs.readFileSync(resolve("index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("./src/entrypoints/entry-server.tsx"))
        .render;
    } else {
      template = indexProd;
      // @ts-ignore
      render = (await import("../../../dist/server/entry-server.js")).render;
    }

    const appHtml = render(url);
    const html = template.replace(`<!--app-html-->`, appHtml);
    Log("Completed SSR process", "SUCCESS");
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e: any) {
    !isProd && vite.ssrFixStacktrace(e);
    res.status(500).end(e.stack);
  }
}

/**
 * Crée le serveur
 * @param {number} port Le port sur lequel faire rouler le serveur
 */
export function initServer(port: number) {
  if (!isTest) {
    createServer(port + 1).then(({ app }) => {
      const httpServer = http.createServer(app);
      initialise_google_services(app);
      const io = new Server(httpServer, { maxHttpBufferSize: 1e15 });
      createSocketServer(io);

      httpServer.listen(port, () => {
        Log(`Le serveur roule sur : http://localhost:${port}`, "SUCCESS");
      });
    });
  }
}

/**
 * Crée le serveur de fichiers si il n'existe pas déjà
 */
export function createFileServer() {
  if (fs.existsSync(fromRoot("/server-files/"))) return;
  fs.mkdirSync(fromRoot("/server-files/"));
  fs.mkdirSync(fromRoot("/server-files/images/"));
  fs.mkdirSync(fromRoot("/server-files/images/org-images"));
}
