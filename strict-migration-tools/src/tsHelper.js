// @ts-check
const path = require("path");
const ts = require("typescript");
const fs = require("fs");

module.exports.getImportsForFile = function getImportsForFile(file, srcRoot) {
  const fileInfo = ts.preProcessFile(fs.readFileSync(file).toString());
  return fileInfo.importedFiles
    .map(importedFile => importedFile.fileName)
    .filter(fileName => !/svg|gif|png|html|less|json|externals|css|ico/.test(fileName)) // remove image imports
    .filter(x => /\//.test(x)) // remove node modules (the import must contain '/')
    .filter(x => !/\@/.test(x)) // remove @ scoped modules
    .filter(
      x =>
        !/url-polyfill|office-ui-fabric|rxjs|\@nteract|bootstrap|promise-polyfill|abort-controller|es6-object-assign|es6-symbol|webcrypto-liner|promise.prototype.finally|object.entries/.test(
          x
        )
    ) // remove other modules
    .filter(x => !/worker-loader/.test(x)) // remove other modules
    .map(fileName => {
      if (/(^\.\/)|(^\.\.\/)/.test(fileName)) {
        return path.join(path.dirname(file), fileName);
      }
      if (/^vs/.test(fileName)) {
        return path.join(srcRoot, fileName);
      }
      return fileName;
    })
    .map(fileName => {
      if (fs.existsSync(`${fileName}.ts`)) {
        return `${fileName}.ts`;
      }
      if (fs.existsSync(`${fileName}.js`)) {
        return `${fileName}.js`;
      }
      if (fs.existsSync(`${fileName}.d.ts`)) {
        return `${fileName}.d.ts`;
      }
      if (fs.existsSync(`${fileName}.tsx`)) {
        return `${fileName}.tsx`;
      }
      throw new Error(`Unresolved import ${fileName} in ${file}`);
    });
};
