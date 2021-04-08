const isCI = require("is-ci");

module.exports = {
  exitOnPageError: false,
  launchOptions: {
    headless: false,
  },
  contextOptions: {
    ignoreHTTPSErrors: true,
    viewport: {
      width: 1920,
      height: 1080,
    },
  },
};
