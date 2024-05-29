// Deploys a Table CosmosDB Account suitable for running the tests in the 'tables' suite.

targetScope = 'resourceGroup'

param accountName string
param ownerName string
param location string
param totalThroughputLimit int = 4000

resource testAccountTables 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: accountName
  location: location
  tags: {
    'DataExplorer:TestAccountType': 'Tables'
    Owner: ownerName
  }
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    capabilities: [
      {
        name: 'EnableTable'
      }
    ]
    capacity: {
      totalThroughputLimit: totalThroughputLimit
    }
  }
}
