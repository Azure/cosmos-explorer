targetScope = 'resourceGroup'

@description('The name of the account to create/update. If the account already exists, it will be updated.')
param accountName string
@description('The name of the owner of this account, usually a Microsoft alias, but can be any string.')
param ownerName string
@description('The Azure location in which to create the account.')
param location string
@description('The total throughput limit for the account. Defaults to 10000 RU/s.')
param totalThroughputLimit int = 10000
@allowed([
  'tables'
  'cassandra'
  'gremlin'
  'mongo'
  'mongo32'
  'sql'
])
@description('The type of account to create.')
param testAccountType string

var kind = (testAccountType == 'mongo' || testAccountType == 'mongo32') ? 'MongoDB' : 'GlobalDocumentDB'
var capabilities = (testAccountType == 'tables') ? [{name: 'EnableTable'}] : (testAccountType == 'cassandra') ? [{name: 'EnableCassandra'}] : (testAccountType == 'gremlin') ? [{name: 'EnableGremlin'}] : []
var serverVersion = (testAccountType == 'mongo32') ? '3.2' : (testAccountType == 'mongo') ? '6.0' : null

resource testCosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: accountName
  location: location
  tags: {
    'DataExplorer:TestAccountType': testAccountType
    Owner: ownerName
  }
  kind: kind
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    apiProperties: {
      serverVersion: serverVersion
    }
    capabilities: capabilities 
    capacity: {
      totalThroughputLimit: totalThroughputLimit
    }
  }
}
