import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import next from "next";

const app = next({
  dev: false,
  conf: {
    distDir: ".next"
  }
});

const handle = app.getRequestHandler();

export const nextServer = onRequest(
  { region: "us-central1", timeoutSeconds: 60 },
  async (req, res) => {
    await app.prepare();
    logger.info("Handling request with Next.js");
    handle(req, res);
  }
);
