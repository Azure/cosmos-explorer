export const cassandra = [
    "AccountEndpoint=(.*).cassandra.cosmosdb.azure.com",
    "HostName=(.*).cassandra.cosmos.azure.com",
];
export const mongo = "mongodb://.*:(.*)@(.*).documents.azure.com";
export const mongoCompute = "mongodb://.*:(.*)@(.*).mongo.cosmos.azure.com";
export const sql = "AccountEndpoint=https://(.*).documents.azure.com";
export const table = "TableEndpoint=https://(.*).table.cosmosdb.azure.com";
