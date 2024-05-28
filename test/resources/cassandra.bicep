// Deploys a Cassandra CosmosDB Account suitable for running the tests in the 'cassandra' suite.

targetScope = 'resourceGroup'

param accountName string
param location string

resource testAccountCassandra 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: accountName
  location: location
  tags: {
    'DataExplorer:TestAccountType': 'Cassandra'
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
        name: 'EnableCassandra'
      }
    ]
    capacity: {
      totalThroughputLimit: 4000
    }
  }
}
