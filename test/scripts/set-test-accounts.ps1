param(
    [Parameter(Mandatory=$false)][string]$ResourceGroup,
    [Parameter(Mandatory=$false)][string]$Subscription,
    [Parameter(Mandatory=$false)][string]$ResourcePrefix
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

$AzSubscription = (Get-AzSubscription -SubscriptionId $Subscription -ErrorAction SilentlyContinue | Select-Object -First 1)
if (-not $AzSubscription) {
    $AzSubscription = (Get-AzSubscription -SubscriptionName $Subscription -ErrorAction SilentlyContinue | Select-Object -First 1)
}
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

Write-Host "Configuring for E2E Testing"
Write-Host "  Subscription: $($AzSubscription.Name) ($($AzSubscription.Id))"
Write-Host "  Resource Group: $($AzResourceGroup.ResourceGroupName)"
Write-Host "  Resource Prefix: $ResourcePrefix"

Get-AzResource -ResourceGroupName $AzResourceGroup.ResourceGroupName -ResourceType "Microsoft.DocumentDB/databaseAccounts" -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.Name -like "$ResourcePrefix*") {
        Write-Host "    Found CosmosDB Account: $($_.Name)"
    }
}

$env:DE_TEST_RESOURCE_GROUP = $AzResourceGroup.ResourceGroupName
$env:DE_TEST_SUBSCRIPTION_ID = $AzSubscription.Id
$env:DE_TEST_ACCOUNT_PREFIX = $ResourcePrefix