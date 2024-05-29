// Deploys a Mongo CosmosDB Account, using mongo 3.2, suitable for running the tests in the 'mongo' suite.

targetScope = 'resourceGroup'

param accountName string
param ownerName string
param location string
param totalThroughputLimit int = 4000

resource testAccountMongo32 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: accountName
  location: location
  tags: {
    'DataExplorer:TestAccountType': 'Mongo32'
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
      serverVersion: '3.2'
    }
    capacity: {
      totalThroughputLimit: totalThroughputLimit
    }
  }
}
