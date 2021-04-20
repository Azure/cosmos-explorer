const isCI = require("is-ci");

module.exports = {
  exitOnPageError: false,
  launchOptions: {
    headless: isCI,
    slowMo: 10,
    timeout: 60000,
  },
  contextOptions: {
    ignoreHTTPSErrors: true,
    viewport: {
      width: 1920,
      height: 1080,
    },
  },
};
