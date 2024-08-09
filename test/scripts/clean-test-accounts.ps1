param(
    [Parameter(Mandatory=$false)][string]$ResourceGroup,
    [Parameter(Mandatory=$false)][string]$Subscription,
    [Parameter(Mandatory=$false)][string]$ResourcePrefix,
    [Parameter(Mandatory=$false)][string]$DatabasePrefix = "t_"
)

Import-Module "Az.Accounts" -Scope Local
Import-Module "Az.Resources" -Scope Local

if (-not $Subscription) {
    # Show the user the currently-selected subscription and ask if that's what they want to use
    $currentSubscription = Get-AzContext | Select-Object -ExpandProperty Subscription
    Write-Host "The currently-selected subscription is $($currentSubscription.Name) ($($currentSubscription.Id))."
    $useCurrentSubscription = Read-Host "Do you want to use this subscription? (y/n)"
    if ($useCurrentSubscription -eq "n") {
        throw "Either specify a subscription using '-Subscription' or select a subscription using 'Select-AzSubscription' before running this script."
    }
    $Subscription = $currentSubscription.Id
}

$AzSubscription = (Get-AzSubscription -SubscriptionId $Subscription -ErrorAction SilentlyContinue | Select-Object -First 1) ?? (Get-AzSubscription -SubscriptionName $Subscription -ErrorAction SilentlyContinue | Select-Object -First 1)
if (-not $AzSubscription) {
    throw "The subscription '$Subscription' could not be found."
}

Set-AzContext $AzSubscription.Id | Out-Null

if (-not $ResourceGroup) {
    # Check for the default resource group name
    $DefaultResourceGroupName = $env:USERNAME + "-e2e-testing"
    if (Get-AzResourceGroup -Name $DefaultResourceGroupName -ErrorAction SilentlyContinue) {
        $ResourceGroup = $DefaultResourceGroupName
    } else {
        $ResourceGroup = Read-Host "Specify the name of the resource group to find the resources in."
    }
}

$AzResourceGroup = Get-AzResourceGroup -Name $ResourceGroup -ErrorAction SilentlyContinue
if (-not $AzResourceGroup) {
    throw "The resource group '$ResourceGroup' could not be found. You have to create the resource group manually before running this script."
}

if (-not $ResourcePrefix) {
    $defaultResourcePrefix = $env:USERNAME + "-e2e-"
    
    # Check for one of the default resources
    $defaultResource = Get-AzResource -ResourceGroupName $AzResourceGroup.ResourceGroupName -ResourceName "$($defaultResourcePrefix)cassandra" -ResourceType "Microsoft.DocumentDB/databaseAccounts" -ErrorAction SilentlyContinue
    if ($defaultResource) {
        Write-Host "Found a resource with the default resource prefix ($defaultResourcePrefix). Configuring that prefix for E2E testing."
        $ResourcePrefix = $defaultResourcePrefix
    } else {
        $ResourcePrefix = Read-Host "Specify the resource prefix used in the resource names."
    }
}

Write-Host "Cleaning E2E Testing Resources"
Write-Host "  Subscription: $($AzSubscription.Name) ($($AzSubscription.Id))"
Write-Host "  Resource Group: $($AzResourceGroup.ResourceGroupName)"
Write-Host "  Resource Prefix: $ResourcePrefix"
Write-Host
Write-Host "All databases with the prefix '$DatabasePrefix' will be deleted."

# Confirm the deletion
$confirm = Read-Host "Are you sure you want to delete these resources? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Aborting."
    exit
}

Get-AzResource -ResourceGroupName $AzResourceGroup.ResourceGroupName -ResourceType "Microsoft.DocumentDB/databaseAccounts" -ErrorAction SilentlyContinue | ForEach-Object {
    $account = Get-AzCosmosDBAccount -ResourceGroupName $AzResourceGroup.ResourceGroupName -Name $_.Name -ErrorAction SilentlyContinue
    if (-not $account) {
        return
    }
    if ($account.Kind -eq "MongoDB") {
        Write-Host "    Cleaning Mongo Account: $($_.Name)"
        Get-AzCosmosDBMongoDBDatabase -AccountName $account.Name -ResourceGroupName $AzResourceGroup.ResourceGroupName | Where-Object { $_.Name -like "$DatabasePrefix*" } | ForEach-Object {
            Write-Host "      Cleaning Database: $($_.Name)"
            Remove-AzCosmosDBMongoDBDatabase -AccountName $account.Name -ResourceGroupName $AzResourceGroup.ResourceGroupName -Name $_.Name
        }
    } elseif ($account.Capabilities | Where-Object { $_.Name -eq "EnableCassandra" }) {
        Write-Host "    Cleaning Cassandra Account: $($_.Name)"
        Get-AzCosmosDBCassandraKeyspace -AccountName $account.Name -ResourceGroupName $AzResourceGroup.ResourceGroupName | Where-Object { $_.Name -like "$DatabasePrefix*" } | ForEach-Object {
            Write-Host "      Cleaning Keyspace: $($_.Name)"
            Remove-AzCosmosDBCassandraKeyspace -AccountName $account.Name -ResourceGroupName $AzResourceGroup.ResourceGroupName -Name $_.Name
        }
    } elseif ($account.Capabilities | Where-Object { $_.Name -eq "EnableGremlin" }) {
        Write-Host "    Cleaning Gremlin Account: $($_.Name)"
        Get-AzCosmosDBGremlinDatabase -AccountName $account.Name -ResourceGroupName $AzResourceGroup.ResourceGroupName | Where-Object { $_.Name -like "$DatabasePrefix*" } | ForEach-Object {
            Write-Host "      Cleaning Database: $($_.Name)"
            Remove-AzCosmosDBGremlinDatabase -AccountName $account.Name -ResourceGroupName $AzResourceGroup.ResourceGroupName -Name $_.Name
        }
    } elseif ($account.Capabilities | Where-Object { $_.Name -eq "EnableTable" }) {
        Write-Host "    Cleaning Table Account: $($_.Name)"
        Get-AzCosmosDBTable -AccountName $account.Name -ResourceGroupName $AzResourceGroup.ResourceGroupName | Where-Object { $_.Name -like "$DatabasePrefix*" } | ForEach-Object {
            Write-Host "      Cleaning Table: $($_.Name)"
            Remove-AzCosmosDBTable -AccountName $account.Name -ResourceGroupName $AzResourceGroup.ResourceGroupName -Name $_.Name
        }
    } else {
        Write-Host "    Cleaning SQL Account: $($_.Name)"
        Get-AzCosmosDBSqlDatabase -AccountName $account.Name -ResourceGroupName $AzResourceGroup.ResourceGroupName | Where-Object { $_.Name -like "$DatabasePrefix*" } | ForEach-Object {
            Write-Host "      Cleaning Database: $($_.Name)"
            Remove-AzCosmosDBSqlDatabase -AccountName $account.Name -ResourceGroupName $AzResourceGroup.ResourceGroupName -Name $_.Name
        }
    }
}