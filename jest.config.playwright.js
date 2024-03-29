module.exports = {
  preset: "jest-playwright-preset",
  testMatch: ["<rootDir>/test/**/*.spec.[jt]s?(x)"],
  setupFiles: ["dotenv/config"],
  testEnvironment: "./test/playwrightEnv.js",
  setupFilesAfterEnv: ["expect-playwright"],
};
