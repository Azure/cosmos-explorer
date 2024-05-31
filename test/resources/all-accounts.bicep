@description('A prefix to apply to the name of each account.')
param accountPrefix string
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
@description('The type of accounts to create.')
param testAccountTypes string[]

var actualPrefix = endsWith(accountPrefix, '-') ? accountPrefix : '${accountPrefix}-'

module testAccount './account.bicep' = [for testAccountType in testAccountTypes: {
    name: '${actualPrefix}${testAccountType}'
    params: {
        accountName: '${actualPrefix}${testAccountType}'
        ownerName: ownerName
        location: location
        totalThroughputLimit: totalThroughputLimit
        testAccountType: testAccountType
    }
}]
