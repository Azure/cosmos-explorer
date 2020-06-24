const isCI = require("is-ci");

module.exports = {
  launch: {
    headless: isCI,
    slowMo: isCI ? null : 20,
    defaultViewport: null
  }
};
