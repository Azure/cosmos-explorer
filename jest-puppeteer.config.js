const isCI = require("is-ci");

module.exports = {
  launch: {
    headless: isCI,
    slowMo: 10,
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    args: ["--disable-web-security"],
  },
};
