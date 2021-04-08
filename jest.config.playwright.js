module.exports = {
  preset: "jest-playwright-preset",
  testMatch: ["<rootDir>/test/**/*.spec.[jt]s?(x)"],
  setupFiles: ["dotenv/config"],
};
