module.exports = {
  preset: "jest-puppeteer",
  testMatch: ["<rootDir>/test/**/*.[jt]s?(x)"],
  setupFiles: ["dotenv/config"]
};
