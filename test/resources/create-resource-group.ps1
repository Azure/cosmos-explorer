param(
    [Parameter(Mandatory=$true)][string]$Subscription,
    [Parameter(Mandatory=$false)][string]$ResourceGroupName,
    [Parameter(Mandatory=$true)][string]$Location
)

Import-Module "Az.Accounts" -Scope Local
Import-Module "Az.Resources" -Scope Local

$AzSubscription = (Get-AzSubscription -SubscriptionId $Subscription -ErrorAction SilentlyContinue) ?? (Get-AzSubscription -SubscriptionName $Subscription -ErrorAction SilentlyContinue)
if(-not $AzSubscription) {
    throw "The subscription '$Subscription' could not be found."
}

Select-AzSubscription -SubscriptionId $Subscription

if(-not $ResourceGroupName) {
    $ResourceGroupName = $env:USERNAME + "-e2e-testing"
}

$AzResourceGroup = Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue
if($AzResourceGroup) {
    Write-Host "The resource group '$ResourceGroupName' already exists."
    return
}

$confirm = Read-Host "Do you want to create the resource group '$ResourceGroupName' in the location '$Location'? (y/n)"
if($confirm -ne "y") {
    throw "The resource group creation was cancelled."
}
$AzResourceGroup = New-AzResourceGroup -Name $ResourceGroupName -Location $Location