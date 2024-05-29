Write-Host "Your test account configuration:"

Import-Module "Az.Accounts" -Scope Local
Import-Module "Az.Resources" -Scope Local

Get-ChildItem env:\DE_TEST_* | ForEach-Object {
    if ($_.Name -eq "DE_TEST_SUBSCRIPTION_ID") {
        $AzSubscription = Get-AzSubscription -SubscriptionId $_.Value -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $AzSubscription) {
            Write-Warning "The subscription '$($_.Value)' could not be found."
        }
        Write-Host "* $($_.Name): $($_.Value) ($($AzSubscription.Name))"
    } elseif ($_.Name -eq "DE_TEST_RESOURCE_GROUP") {
        $AzResourceGroup = Get-AzResourceGroup -Name $_.Value -ErrorAction SilentlyContinue
        if (-not $AzResourceGroup) {
            Write-Warning "The resource group '$($_.Value)' could not be found."
        }
        Write-Host "* $($_.Name): $($_.Value) (Confirmed)"
    } else {
        Write-Host "* $($_.Name): $($_.Value)"
    }
}