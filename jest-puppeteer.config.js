const isCI = require("is-ci");

module.exports = {
  launch: {
    headless: isCI,
    slowMo: isCI ? 20 : null,
    defaultViewport: null
  }
};
