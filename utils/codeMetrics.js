const fg = require("fast-glob");
const appInsights = require("applicationinsights");
appInsights.setup("a19ced82-51c3-4fce-9d26-3b13a77a70be").start();

const client = appInsights.defaultClient;
const htmlFiles = fg.sync(["**/*.html", "!node_modules"]);

client.trackMetric({
  name: "HTML File Count",
  value: htmlFiles.length,
});

appInsights.defaultClient.flush({
  callback: () => {
    process.exitCode = 0;
  },
});
