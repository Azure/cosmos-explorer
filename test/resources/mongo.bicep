// Deploys a Mongo CosmosDB Account suitable for running the tests in the 'mongo' suite.

targetScope = 'resourceGroup'

param accountName string
param ownerName string
param location string
param totalThroughputLimit int = 4000

resource testAccountMongo 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: accountName
  location: location
  tags: {
    'DataExplorer:TestAccountType': 'Mongo'
    Owner: ownerName
  }
  kind: 'MongoDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    apiProperties: {
      serverVersion: '6.0'
    }
    capabilities: [
      {
        name: 'EnableMongo'
      }
    ]
    capacity: {
      totalThroughputLimit: totalThroughputLimit
    }
  }
}
