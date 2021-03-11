module.exports = {
  preset: "jest-playwright",
  testMatch: ["<rootDir>/test/**/*.spec.[jt]s?(x)"],
  setupFiles: ["dotenv/config"],
};
