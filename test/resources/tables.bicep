// Deploys a Table CosmosDB Account suitable for running the tests in the 'tables' suite.

targetScope = 'resourceGroup'

@description('The name of the account to create/update. If the account already exists, it will be updated.')
param accountName string
@description('The name of the owner of this account, usually a Microsoft alias, but can be any string.')
param ownerName string
@description('The Azure location in which to create the account.')
param location string
@description('The total throughput limit for the account. Defaults to 10000 RU/s.')
param totalThroughputLimit int = 10000

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
