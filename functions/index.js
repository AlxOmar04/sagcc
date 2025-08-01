const functions = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const next = require("next");

const app = next({
  dev: false,
  conf: {
    distDir: ".next"
  }
});

const handle = app.getRequestHandler();

exports.nextServer = functions.onRequest({ region: "us-central1", timeoutSeconds: 60 }, async (req, res) => {
  await app.prepare();
  logger.info("Handling request with Next.js");
  return handle(req, res);
});
