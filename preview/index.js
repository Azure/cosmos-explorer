import { createServer } from "node:http";
import { createApp } from "./app.js";

const port = process.env.PORT || 3000;
const previewStorageWebsiteEndpoint = "_REPLACE_STORAGE_WEBSITE_ENDPOINT_";
const server = createServer(createApp({ previewStorageWebsiteEndpoint }));

server.on("error", (error) => {
  console.error("Preview server failed to start:", error.code);
  process.exitCode = 1;
});

server.listen(port, () => {
  process.stdout.write(`Preview app listening on port: ${server.address().port}\n`);
});
