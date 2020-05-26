const { CosmosClient } = require("@azure/cosmos");

module.exports = new CosmosClient({
  endpoint: "https://0.0.0.0:8081",
  key: "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
});
