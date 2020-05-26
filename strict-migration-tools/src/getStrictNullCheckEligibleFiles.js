// @ts-check
const path = require("path");
const fs = require("fs");
const { getImportsForFile } = require("./tsHelper");
const glob = require("glob");
const config = require("./config");

/**
 * @param {string} srcRoot
 * @param {{ includeTests: boolean }} [options]
 */
const forEachFileInSrc = (srcRoot, options) => {
  return new Promise((resolve, reject) => {
    glob(`${srcRoot}/**/*.ts`, (err, files) => {
      if (err) {
        return reject(err);
      }

      return resolve(
        files.filter(
          file => !file.endsWith(".d.ts") && (options && options.includeTests ? true : !file.endsWith(".test.ts"))
        )
      );
    });
  });
};
module.exports.forEachFileInSrc = forEachFileInSrc;

/**
 * @param {string} vscodeRoot
 * @param {(file: string) => void} forEach
 * @param {{ includeTests: boolean }} [options]
 */
module.exports.forStrictNullCheckEligibleFiles = async (vscodeRoot, forEach, options) => {
  const srcRoot = path.join(vscodeRoot, "src");

  const tsconfig = JSON.parse(fs.readFileSync(path.join(srcRoot, config.targetTsconfig)).toString());
  const checkedFiles = await getCheckedFiles(tsconfig, vscodeRoot);

  const imports = new Map();
  const getMemoizedImportsForFile = (file, srcRoot) => {
    if (imports.has(file)) {
      return imports.get(file);
    }
    const importList = getImportsForFile(file, srcRoot);
    imports.set(file, importList);
    return importList;
  };

  const files = await forEachFileInSrc(srcRoot, options);
  return files
    .filter(file => !checkedFiles.has(file))
    .filter(file => !config.skippedFiles.has(path.relative(srcRoot, file)))
    .filter(file => {
      const allProjImports = getMemoizedImportsForFile(file, srcRoot);

      const nonCheckedImports = allProjImports
        .filter(x => x !== file)
        .filter(imp => {
          if (checkedFiles.has(imp)) {
            return false;
          }
          // Don't treat cycles as blocking
          const impImports = getMemoizedImportsForFile(imp, srcRoot);
          return impImports.filter(x => x !== file).filter(x => !checkedFiles.has(x)).length !== 0;
        });

      const isEdge = nonCheckedImports.length === 0;
      if (isEdge) {
        forEach(file);
      }
      return isEdge;
    });
};

async function getCheckedFiles(tsconfig, srcRoot) {
  const set = new Set(tsconfig.files.map(include => path.join(srcRoot, include)));
  const includes = tsconfig.include.map(include => {
    return new Promise((resolve, reject) => {
      glob(path.join(srcRoot, include), (err, files) => {
        if (err) {
          return reject(err);
        }

        for (const file of files) {
          set.add(file);
        }
        resolve();
      });
    });
  });
  await Promise.all(includes);
  return set;
}
