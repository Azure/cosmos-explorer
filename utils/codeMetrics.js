/* eslint-disable no-console */
const fs = require("fs");
const fg = require("fast-glob");
const appInsights = require("applicationinsights");
appInsights.setup(process.env.CODE_METRICS_APP_ID).start();

const client = appInsights.defaultClient;
const htmlFiles = fg.sync(["**/*.html", "!node_modules"]);
const strictModeJSON = require("../tsconfig.strict.json");
const eslintIgnore = fs.readFileSync(".eslintignore", { encoding: "utf8" });

console.log("HTML File Count", htmlFiles.length);
client.trackMetric({
  name: "HTML File Count",
  value: htmlFiles.length,
});

console.log("TypeScript Strict File Count", strictModeJSON.files.length);
client.trackMetric({
  name: "TypeScript Strict File Count",
  value: strictModeJSON.files.length,
});

console.log("Unlinted File Count", eslintIgnore.split("\n").length);
client.trackMetric({
  name: "Unlinted File Count",
  value: eslintIgnore.split("\n").length,
});

appInsights.defaultClient.flush({
  callback: () => {
    process.exitCode = 0;
  },
});
