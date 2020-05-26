const fs = require("fs-extra");

const dataExplorerLocalPath = process.env.BUILD_ARTIFACTSTAGINGDIRECTORY || process.env.DATAEXPLORER_PATH;
const dataExplorerEmulatorPath = process.env.ProgramFiles + "/Azure Cosmos DB Emulator/Packages/DataExplorer";
const newDataExplorerEmulatorPath = process.env.ProgramFiles + "/Azure Cosmos Emulator/Packages/DataExplorer";

console.log("Copying dist/ to portal and emulator");
cleanAndCopy(dataExplorerLocalPath);
cleanAndCopy(dataExplorerEmulatorPath);
cleanAndCopy(newDataExplorerEmulatorPath);

function cleanAndCopy(path) {
  if (fs.existsSync(path)) {
    fs.removeSync(path);
    fs.copySync("dist", path);
    if (fs.existsSync("Contracts")) {
      fs.copySync("Contracts", path + "/contracts");
    } else {
      console.log("Contracts folder does not exist. Doing nothing.");
    }
  } else {
    console.log(`Path: "${path}" does not exist. Doing nothing.`);
  }
}
