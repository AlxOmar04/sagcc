const functions = require("firebase-functions/v2/https"); 
const { onRequest } = require("firebase-functions/v2/https");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
  conf: {
    distDir: ".next",
  },
});
const handle = app.getRequestHandler();

// Exporta como función Gen 2
exports.nextApp = onRequest({ region: "us-central1" }, async (req, res) => {
  await app.prepare();
  return handle(req, res);
});
