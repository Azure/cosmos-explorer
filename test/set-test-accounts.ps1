param(
    [Parameter(Mandatory=$false)][string]$ResourceGroup,
    [Parameter(Mandatory=$false)][string]$Subscription,
    [Parameter(Mandatory=$false)][string]$ResourcePrefix
)

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

$AzSubscription = (Get-AzSubscription -SubscriptionId $Subscription -ErrorAction SilentlyContinue | Select -First 1) ?? (Get-AzSubscription -SubscriptionName $Subscription -ErrorAction SilentlyContinue | Select -First 1)
if (-not $AzSubscription) {
    throw "The subscription '$Subscription' could not be found."
}

Set-AzContext $AzSubscription.Id

if (-not $ResourceGroup) {
    $ResourceGroup = Read-Host "Specify the name of the resource group to find the resources in."
}

$AzResourceGroup = Get-AzResourceGroup -Name $ResourceGroup -ErrorAction SilentlyContinue
if (-not $AzResourceGroup) {
    throw "The resource group '$ResourceGroup' could not be found. You have to create the resource group manually before running this script."
}

if (-not $ResourcePrefix) {
    $defaultResourcePrefix = $env:USERNAME + "-e2e-"
    $useDefault = Read-Host "Do your resources use the default resource prefix? ($defaultResourcePrefix) (y/n)"
    if ($useDefault -eq "n") {
        $ResourcePrefix = Read-Host "Specify the resource prefix used in the resource names."
    } else {
        $ResourcePrefix = $defaultResourcePrefix
    }
}

Write-Host "Configuring for E2E Testing"
Write-Host "  Subscription: $($AzSubscription.Name) ($($AzSubscription.Id))"
Write-Host "  Resource Group: $($AzResourceGroup.ResourceGroupName)"
Write-Host "  Resource Prefix: $ResourcePrefix"

$env:DE_TEST_RESOURCE_GROUP = $AzResourceGroup.ResourceGroupName
$env:DE_TEST_SUBSCRIPTION_ID = $AzSubscription.Id
$env:DE_TEST_ACCOUNT_PREFIX = $ResourcePrefix