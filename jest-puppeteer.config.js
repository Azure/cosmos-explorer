const isCI = require("is-ci");

module.exports = {
  launch: {
    headless: isCI,
    slowMo: 30,
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    args: ["--disable-web-security"]
  }
};
