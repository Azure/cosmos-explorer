const emulatorConfig = require("./emulatorConfig.json");

export const EmulatorMasterKey = emulatorConfig.EmulatorMasterKey || "";
export const emulatorAccount = emulatorConfig.Account || {};
console.log("I am master", EmulatorMasterKey);
