const express = require("express");
const fs = require("node:fs");
const path = require("node:path");

const redirectBridgeDirectory = path.join(__dirname, "redirect-bridge");

function installRedirectBridge(app, directory = redirectBridgeDirectory) {
  if (!fs.existsSync(path.join(directory, "redirectBridge.html"))) {
    throw new Error(
      "Preview redirect bridge is missing. Run npm run build:bridge in preview before starting the server.",
    );
  }

  app.use(
    express.static(directory, {
      index: false,
      redirect: false,
      etag: false,
      lastModified: false,
      setHeaders: (response) => {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.removeHeader("Cross-Origin-Opener-Policy");
      },
    }),
  );
}

module.exports = { installRedirectBridge };
