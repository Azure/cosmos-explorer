// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const path = require("path");
const repoRoot = path.join(__dirname, "../").replace(/\\/g, "/");

module.exports = {
  repoRoot: repoRoot,
  srcRoot: `${repoRoot}/src`,
  targetTsconfig: "tsconfig.strict.json",
  skippedFiles: new Set([]),
};
