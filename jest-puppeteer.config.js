const isCI = require("is-ci");

module.exports = {
  launch: {
    headless: isCI,
    slowMo: 100,
    defaultViewport: null,
    ignoreHTTPSErrors: true
  }
};
