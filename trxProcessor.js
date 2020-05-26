var builder = require("jest-trx-results-processor");

var processor = builder({
  outputFile: "jest-results.trx"
});

module.exports = processor;
