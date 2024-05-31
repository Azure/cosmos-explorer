param(
    [Parameter(Mandatory=$false)][string]$ResourceGroup,
    [Parameter(Mandatory=$false)][string]$Subscription,
    [Parameter(Mandatory=$false)][string]$Location,
    [Parameter(Mandatory=$false)][string]$ResourcePrefix,
    [ValidateSet("tables", "cassandra", "gremlin", "mongo", "mongo32", "sql")] # This must be a constant so we can't re-use the $AllResourceTypes variable :(
    [Parameter(Mandatory=$false)][string[]]$ResourceSets,
    [Parameter(Mandatory=$false)][string]$OwnerName,
    [Parameter(Mandatory=$false)][int]$TotalThroughputLimit = 10000,
    [Parameter(Mandatory=$false)][switch]$WhatIf
)

$AllResourceTypes = @(
  "tables",
  "cassandra",
  "gremlin",
  "mongo",
  "mongo32",
  "sql"
)

if (-not (Get-Command bicep -ErrorAction SilentlyContinue)) {
    throw "The Bicep CLI is required to run this script. Please install it first."
}

if (-not (Get-AzContext)) {
    throw "Please login to your Azure account using Connect-AzAccount before running this script."
}

$AccountId = (Get-AzContext).Account.Id
$MicrosoftAlias = $null
if($AccountId.EndsWith("microsoft.com")) {
    $MicrosoftAlias = $AccountId.Split("@")[0]
} else {
    Write-Warning "This script is designed with Microsoft employees in mind. However, you're welcome to use it as well! Please note that some features may not work as expected."
    $continue = Read-Host "Do you want to continue? (y/n)"
    if ($continue -ne "y") {
        throw "Deployment cancelled."
    }
}

if(-not $ResourcePrefix) {
    if(-not $MicrosoftAlias) {
        throw "If you're not a Microsoft employee, you must specify a resource prefix using '-ResourcePrefix'. This can be any value, it's used as the prefix for the names of Azure resources to avoid conflicts."
    } else {
        $ResourcePrefix = $MicrosoftAlias + "-e2e-"
    }
}

if(-not $OwnerName) {
    if(-not $MicrosoftAlias) {
        throw "If you're not a Microsoft employee, you must specify an owner name using '-OwnerName'. This can be any value, it's used to apply the 'Owner' tag to Azure resources for easier identification."
    } else {
        $OwnerName = $MicrosoftAlias
    }
}

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

$AzSubscription = (Get-AzSubscription -SubscriptionId $Subscription -ErrorAction SilentlyContinue) ?? (Get-AzSubscription -SubscriptionName $Subscription -ErrorAction SilentlyContinue)
if (-not $AzSubscription) {
    throw "The subscription '$Subscription' could not be found."
}

Set-AzContext $AzSubscription

if (-not $ResourceGroup) {
    $ResourceGroup = Read-Host "Specify the name of the resource group to deploy the resources to."
}

$AzResourceGroup = Get-AzResourceGroup -Name $ResourceGroup -ErrorAction SilentlyContinue
if (-not $AzResourceGroup) {
    throw "The resource group '$ResourceGroup' could not be found. You have to create the resource group manually before running this script."
}

if (-not $Location) {
    $Location = $AzResourceGroup.Location
}

$AzLocation = Get-AzLocation | Where-Object { $_.Location -eq $Location }
if (-not $AzLocation) {
    throw "The location '$Location' could not be found."
}

if (-not $ResourceSets) {
    $ResourceSets = $AllResourceTypes
} else {
    # Normalize the resource set names to the value in AllResourceTypes
    $ResourceSets = $ResourceSets | ForEach-Object { $_.ToLower() }
}

Write-Host "Deploying test resource sets: $ResourceSets"
Write-Host "  in $($AzLocation.DisplayName)"
Write-Host "  to resource group $ResourceGroup"
Write-Host "  in subscription $($AzSubscription.Name) ($($AzSubscription.Id))."
if($WhatIf) {
    Write-Host "  (What-If mode enabled)"
}

$continue = Read-Host "Do you want to continue? (y/n)"
if ($continue -ne "y") {
    throw "Deployment cancelled."
}

$bicepFile = Join-Path $PSScriptRoot "all-accounts.bicep"
Write-Host "Deploying resources using $bicepFile"
New-AzResourceGroupDeployment `
    -ResourceGroupName $AzResourceGroup.ResourceGroupName `
    -TemplateFile $bicepFile `
    -WhatIf:$WhatIf `
    -accountPrefix $ResourcePrefix `
    -testAccountTypes $ResourceSets `
    -location $AzLocation.Location `
    -ownerName $OwnerName `
    -totalThroughputLimit $TotalThroughputLimit