// Deploys a Mongo CosmosDB Account, using mongo 3.2, suitable for running the tests in the 'mongo' suite.

targetScope = 'resourceGroup'

@description('The name of the account to create/update. If the account already exists, it will be updated.')
param accountName string
@description('The name of the owner of this account, usually a Microsoft alias, but can be any string.')
param ownerName string
@description('The Azure location in which to create the account.')
param location string
@description('The total throughput limit for the account. Defaults to 10000 RU/s.')
param totalThroughputLimit int = 10000

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
