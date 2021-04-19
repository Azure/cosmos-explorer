// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// @ts-check
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const imports = new Map();
const getMemoizedImportsForFile = (file, srcRoot) => {
  if (imports.has(file)) {
    return imports.get(file);
  }
  const importList = getImportsForFile(file, srcRoot);
  imports.set(file, importList);
  return importList;
};

function getImportsForFile(parent, srcRoot) {
  return ts
    .preProcessFile(fs.readFileSync(parent).toString())
    .importedFiles.map(({ fileName }) => fileName)
    .filter((base) => /\//.test(base)) // remove node modules (the import must contain '/')
    .map((base) => (/(^\.\/)|(^\.\.\/)/.test(base) ? path.join(path.dirname(parent), base) : path.join(srcRoot, base)))
    .map((base) => (fs.existsSync(base) ? path.join(base, "index") : base))
    .map((base) => base.replace(/\\/g, "/"))
    .map((base) => ["ts", "tsx", "d.ts", "js", "jsx"].map((ext) => `${base}.${ext}`).find(fs.existsSync))
    .filter((base) => base && base !== parent);
}

module.exports = {
  getImportsForFile,
  getMemoizedImportsForFile,
};
