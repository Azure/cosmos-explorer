#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Cosmos DB Connectivity Diagnostic Script
    Captures local network connectivity, private network posture, and RBAC evidence.

.DESCRIPTION
    This script performs comprehensive network and access diagnostics for Cosmos DB accounts.
    It can run in interactive or non-interactive mode and produces a JSON report for triage.

.PARAMETER EndpointUrl
    The Cosmos DB account endpoint URL.
    Format: https://<account-name>.documents.azure.com or https://<account-name>.documents.azure.com:443/
    WHERE TO GET: Azure Portal > Cosmos DB Account > Overview tab > URI field
    OR: Use the endpoint shown in Cosmos Explorer connection string

.PARAMETER SubscriptionId
    Azure subscription ID containing the Cosmos account.
    WHERE TO GET: Azure Portal > Subscriptions > Copy Subscription ID
    FORMAT: 12345678-1234-1234-1234-123456789012

.PARAMETER ResourceGroup
    Azure resource group name containing the Cosmos account.
    WHERE TO GET: Azure Portal > Cosmos DB Account > Resource group field (top-right)

.PARAMETER AccountName
    Cosmos DB account name.
    WHERE TO GET: Azure Portal > Cosmos DB Account > Account Name field
    Or extract from endpoint URL (part before .documents.azure.com)

.PARAMETER PrivateEndpointIP
    (Optional) Expected private endpoint IP if account uses private link.
    WHERE TO GET: Azure Portal > Cosmos DB Account > Private Endpoint Connections tab > Private IP address column

.PARAMETER VpnSubnetRange
    (Optional) Customer's VPN/client subnet CIDR for route analysis.
    FORMAT: 10.0.0.0/24
    WHERE TO GET: Ask your network team or check VPN client properties

.PARAMETER Interactive
    If specified, script prompts for missing parameters instead of requiring them as arguments.

.PARAMETER Redact
    If specified, output JSON redacts sensitive identifiers (tenant ID, subscription ID, usernames).

.EXAMPLE
    # Interactive mode - script will prompt for inputs
    .\Diagnose-CosmosConnectivity.ps1 -Interactive

.EXAMPLE
    # Non-interactive with full parameters
    .\Diagnose-CosmosConnectivity.ps1 `
      -EndpointUrl "https://my-cosmos-account.documents.azure.com" `
      -SubscriptionId "12345678-1234-1234-1234-123456789012" `
      -ResourceGroup "my-rg" `
      -AccountName "my-cosmos-account"

.EXAMPLE
    # With private endpoint and output redaction
    .\Diagnose-CosmosConnectivity.ps1 `
      -EndpointUrl "https://my-cosmos-account.documents.azure.com" `
      -SubscriptionId "12345678-1234-1234-1234-123456789012" `
      -ResourceGroup "my-rg" `
      -AccountName "my-cosmos-account" `
      -PrivateEndpointIP "10.123.171.30" `
      -Redact
#>

param(
    [Parameter(ValueFromPipelineByPropertyName=$true)]
    [ValidateScript({$_ -match "^https://[a-z0-9-]+\.documents\.azure\.com" -or $_ -match "^https://[a-z0-9-]+\.documents\.azure\.com:443"})]
    [string]$EndpointUrl,

    [Parameter(ValueFromPipelineByPropertyName=$true)]
    [guid]$SubscriptionId,

    [Parameter(ValueFromPipelineByPropertyName=$true)]
    [string]$ResourceGroup,

    [Parameter(ValueFromPipelineByPropertyName=$true)]
    [string]$AccountName,

    [Parameter(ValueFromPipelineByPropertyName=$true)]
    [string]$PrivateEndpointIP,

    [Parameter(ValueFromPipelineByPropertyName=$true)]
    [string]$VpnSubnetRange,

    [switch]$Interactive,

    [switch]$Redact
)

# ============================================================================
# Configuration
# ============================================================================

$ScriptVersion = "1.0.0"
$DiagnosticTimestamp = Get-Date -Format "o"
$TcpConnectTimeoutMs = 5000
$DnsTimeoutMs = 5000

# ============================================================================
# Helper Functions
# ============================================================================

function Show-InputInstructions {
    Write-Host @"
═════════════════════════════════════════════════════════════════════════════
COSMOS DB CONNECTIVITY DIAGNOSTIC SCRIPT v$ScriptVersion
═════════════════════════════════════════════════════════════════════════════

This script will collect network and access diagnostics for your Cosmos DB account.

WHERE TO FIND YOUR INPUTS:
─────────────────────────────────────────────────────────────────────────────

1. ENDPOINT URL (Required)
   Location: Azure Portal > Cosmos DB Account > Overview tab
   Look for: "URI" field
   Example: https://my-cosmos-account.documents.azure.com
   ⚠ Include https:// but do NOT include trailing slash or port suffix

2. SUBSCRIPTION ID (Required)
   Location: Azure Portal > Subscriptions
   Look for: "Subscription ID" column or click your subscription > Copy ID
   Format: 12345678-1234-1234-1234-123456789012

3. RESOURCE GROUP (Required)
   Location: Azure Portal > Cosmos DB Account > Top-right corner
   Look for: "Resource group" field
   Example: my-production-rg

4. ACCOUNT NAME (Required)
   Location: Either extract from endpoint URL or find in portal
   From URL: Take the part before ".documents.azure.com"
   From Portal: Account name appears in the breadcrumb and overview
   Example: my-cosmos-account

5. PRIVATE ENDPOINT IP (Optional, but recommended)
   Location: Azure Portal > Cosmos DB Account > Private Endpoint Connections
   Look for: "Private IP address" column (only if private endpoints exist)
   Format: 10.123.171.30 (will be 10.x.x.x or 172.16-31.x.x range)
   Skip this if: You are using public endpoint only

6. VPN SUBNET RANGE (Optional)
   Location: Ask your network team or VPN client settings
   Used to: Analyze if routing from your network to private endpoint is blocked
   Format: 10.0.0.0/24 (CIDR notation)
   Skip this if: You are not using a VPN

═════════════════════════════════════════════════════════════════════════════

"@
}

function Read-InputsInteractively {
    Show-InputInstructions
    
    Write-Host "Please provide the following information:" -ForegroundColor Cyan
    Write-Host ""
    
    # Endpoint URL
    do {
        $endpoint = Read-Host "Endpoint URL (e.g., https://my-cosmos.documents.azure.com)"
        if ($endpoint -notmatch "^https://[a-z0-9-]+\.documents\.azure\.com") {
            Write-Host "Invalid format. Expected: https://<account-name>.documents.azure.com" -ForegroundColor Yellow
        }
    } while ($endpoint -notmatch "^https://[a-z0-9-]+\.documents\.azure\.com")

    # Subscription ID
    do {
        $subId = Read-Host "Subscription ID (12345678-1234-1234-1234-123456789012)"
        if ($subId -notmatch "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$") {
            Write-Host "Invalid format. Expected GUID format." -ForegroundColor Yellow
        }
    } while ($subId -notmatch "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")

    $rg = Read-Host "Resource Group name"
    $account = Read-Host "Account Name"
    $peIP = Read-Host "Private Endpoint IP (optional, press Enter to skip)"
    $vpnSubnet = Read-Host "VPN Subnet Range (optional, e.g., 10.0.0.0/24, press Enter to skip)"

    return @{
        EndpointUrl = $endpoint
        SubscriptionId = [guid]$subId
        ResourceGroup = $rg
        AccountName = $account
        PrivateEndpointIP = if ($peIP) { $peIP } else { $null }
        VpnSubnetRange = if ($vpnSubnet) { $vpnSubnet } else { $null }
    }
}

function Invoke-DnsResolution {
    param([string]$Hostname)
    
    $result = @{
        hostname = $Hostname
        succeeded = $false
        addresses = @()
        error = $null
        dnsServers = @()
        latencyMs = 0
    }

    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $addresses = [System.Net.Dns]::GetHostAddresses($Hostname)
        $stopwatch.Stop()

        $result.succeeded = $true
        $result.addresses = @($addresses | ForEach-Object { $_.ToString() })
        $result.latencyMs = [int]$stopwatch.ElapsedMilliseconds

        # Try to get DNS servers (Windows/Linux specific)
        if ($PSVersionTable.Platform -ne "Unix" -or $PSVersionTable.OS -like "*Linux*") {
            try {
                $dnsConfig = Get-DnsClientServerAddress -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($dnsConfig) {
                    $result.dnsServers = @($dnsConfig.ServerAddresses)
                }
            } catch { }
        }
    } catch {
        $result.error = $_.Exception.Message
    }

    return $result
}

function Invoke-TcpConnectivityTest {
    param(
        [string]$Hostname,
        [int]$Port = 443,
        [int]$TimeoutMs = 5000
    )

    $result = @{
        hostname = $Hostname
        port = $Port
        succeeded = $false
        error = $null
        latencyMs = 0
        sourceIp = $null
    }

    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $task = $tcpClient.ConnectAsync($Hostname, $Port)
        $task.Wait($TimeoutMs)
        $stopwatch.Stop()

        if ($task.IsCompleted) {
            $result.succeeded = $true
            $result.latencyMs = [int]$stopwatch.ElapsedMilliseconds
            
            # Try to get source IP
            try {
                $endpoint = $tcpClient.Client.LocalEndPoint
                $result.sourceIp = $endpoint.Address.ToString()
            } catch { }
        } else {
            $result.error = "Connection timeout after ${TimeoutMs}ms"
        }

        $tcpClient.Close()
    } catch {
        $result.error = $_.Exception.Message
    }

    return $result
}

function Invoke-HttpsProbe {
    param([string]$Url)

    $result = @{
        url = $Url
        succeeded = $false
        statusCode = $null
        error = $null
        latencyMs = 0
    }

    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 5 -ErrorAction Stop
        $stopwatch.Stop()

        $result.succeeded = $true
        $result.statusCode = [int]$response.StatusCode
        $result.latencyMs = [int]$stopwatch.ElapsedMilliseconds
    } catch {
        $result.statusCode = [int]($_.Exception.Response.StatusCode)
        $result.error = $_.Exception.Message
    }

    return $result
}

function Get-PrivateNetworkIndicators {
    param(
        [string[]]$ResolvedAddresses,
        [string]$PrivateEndpointIP,
        [string]$VpnSubnetRange
    )

    $result = @{
        isPrivateRange = $false
        indicators = @()
        matchesExpectedPrivateEndpoint = $false
        vpnRouteWarning = $null
    }

    # Check if resolved IPs are private range
    foreach ($addr in $ResolvedAddresses) {
        if (IsPrivateIpAddress $addr) {
            $result.isPrivateRange = $true
            $result.indicators += "Resolved to RFC 1918 private IP range ($addr)"
        }
    }

    # Check if matches expected private endpoint
    if ($PrivateEndpointIP -and $ResolvedAddresses -contains $PrivateEndpointIP) {
        $result.matchesExpectedPrivateEndpoint = $true
        $result.indicators += "Matches expected private endpoint IP ($PrivateEndpointIP)"
    } elseif ($PrivateEndpointIP -and $ResolvedAddresses.Count -gt 0) {
        $result.indicators += "WARNING: Resolved to $($ResolvedAddresses[0]) but expected private endpoint IP is $PrivateEndpointIP"
    }

    return $result
}

function IsPrivateIpAddress {
    param([string]$IpAddress)
    
    try {
        $ip = [System.Net.IPAddress]::Parse($IpAddress)
        # RFC 1918 ranges
        if ($ip.ToString() -match "^10\." -or $ip.ToString() -match "^172\.(1[6-9]|2[0-9]|3[01])\." -or $ip.ToString() -match "^192\.168\.") {
            return $true
        }
        # Loopback
        if ($ip.AddressFamily -eq "InterNetwork" -and $ip.GetAddressBytes()[0] -eq 127) {
            return $true
        }
    } catch { }
    
    return $false
}

function Get-AzureCliContext {
    $result = @{
        installed = $false
        authenticated = $false
        currentUser = $null
        currentTenant = $null
        currentSubscription = $null
        error = $null
    }

    try {
        $output = & az --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $result.installed = $true
        }
    } catch {
        $result.error = "Azure CLI not found. Skipping Azure context checks."
        return $result
    }

    try {
        $account = & az account show 2>&1 | ConvertFrom-Json
        $result.authenticated = $true
        $result.currentUser = $account.user.name
        $result.currentTenant = $account.tenantId
        $result.currentSubscription = $account.id
    } catch {
        $result.error = "Not authenticated with Azure CLI. Run 'az login' to proceed with Azure checks."
    }

    return $result
}

function Get-AzureAccountNetworkConfig {
    param(
        [guid]$SubscriptionId,
        [string]$ResourceGroup,
        [string]$AccountName
    )

    $result = @{
        checked = $false
        publicNetworkAccessRestricted = $null
        privateEndpoints = @()
        vnetRules = @()
        error = $null
    }

    try {
        $scope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.DocumentDB/databaseAccounts/$AccountName"
        $account = & az cosmosdb show --resource-group $ResourceGroup --name $AccountName 2>&1 | ConvertFrom-Json
        
        if ($account) {
            $result.checked = $true
            $result.publicNetworkAccessRestricted = $account.properties.publicNetworkAccess -eq "Disabled"
            
            # Get private endpoints
            $peConnections = & az cosmosdb private-endpoint-connection list --resource-group $ResourceGroup --name $AccountName 2>&1 | ConvertFrom-Json
            if ($peConnections) {
                $result.privateEndpoints = @($peConnections | Select-Object -Property id, @{n='state';e={$_.properties.privateLinkServiceConnectionState.status}})
            }
        }
    } catch {
        $result.error = $_.Exception.Message
    }

    return $result
}

function Get-RbacAssessment {
    param(
        [guid]$SubscriptionId,
        [string]$ResourceGroup,
        [string]$AccountName
    )

    $result = @{
        checked = $false
        canReadAccount = $false
        canManageAccount = $false
        canExecuteDataPlaneOps = $false
        roleAssignments = @()
        classification = "unknown"
        error = $null
    }

    try {
        $scope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.DocumentDB/databaseAccounts/$AccountName"
        
        # Try to read account (implies Reader or higher)
        $account = & az cosmosdb show --resource-group $ResourceGroup --name $AccountName 2>&1 | ConvertFrom-Json
        if ($account) {
            $result.checked = $true
            $result.canReadAccount = $true
            
            # Check role assignments
            $roles = & az role assignment list --scope $scope 2>&1 | ConvertFrom-Json
            if ($roles) {
                $result.roleAssignments = @($roles | Select-Object -Property roleDefinitionName, principalName)
                
                # Classify permissions
                $roleNames = $roles | Select-Object -ExpandProperty roleDefinitionName
                if ($roleNames -contains "Contributor" -or $roleNames -contains "Owner") {
                    $result.canManageAccount = $true
                    $result.canExecuteDataPlaneOps = $true
                    $result.classification = "sufficient"
                } elseif ($roleNames -contains "Cosmos DB Operator" -or $roleNames -contains "Cosmos DB Account Reader") {
                    $result.canExecuteDataPlaneOps = $true
                    $result.classification = "partial"
                } else {
                    $result.classification = "partial"
                }
            }
        }
    } catch {
        $result.error = $_.Exception.Message
        $result.classification = "insufficient"
    }

    return $result
}

function Invoke-Classification {
    param(
        [hashtable]$DnsResult,
        [hashtable]$TcpResult,
        [hashtable]$PrivateNetworkIndicators,
        [hashtable]$AzureNetworkConfig
    )

    $classification = @{
        status = "unknown"
        code = "unknown"
        summary = "Unable to classify"
        rootCause = $null
        recommendedActions = @()
    }

    # DNS failure
    if (-not $DnsResult.succeeded) {
        $classification.status = "failure"
        $classification.code = "dns_resolution_failed"
        $classification.summary = "DNS resolution failed. The Cosmos DB endpoint hostname cannot be resolved."
        $classification.rootCause = "DNS configuration, VPN/proxy DNS redirect, or network connectivity issue"
        $classification.recommendedActions = @(
            "1. Check if you are connected to corporate VPN or proxy that intercepts DNS",
            "2. Manually run: nslookup $($DnsResult.hostname)",
            "3. If nslookup fails, check with your network team or ISP",
            "4. Try pinging the endpoint or using nslookup with alternate DNS: nslookup $($DnsResult.hostname) 8.8.8.8"
        )
        return $classification
    }

    # DNS succeeded but TCP failed
    if ($DnsResult.succeeded -and -not $TcpResult.succeeded) {
        $classification.status = "failure"
        $classification.code = "tcp_connectivity_blocked"
        $classification.summary = "DNS resolution succeeded but TCP 443 connection failed. Network path is blocked."

        if ($PrivateNetworkIndicators.isPrivateRange) {
            $classification.rootCause = "Private endpoint configured but network path blocked (VPN routing, firewall/NVA, NSG, UDR, or peering issue)"
            $classification.recommendedActions = @(
                "1. Verify VPN connectivity and that your client subnet can route to the private endpoint subnet",
                "2. Ask your network team to verify routing between $([System.Net.Dns]::GetHostName()) and private endpoint $($DnsResult.addresses[0])",
                "3. Check Azure network security groups (NSGs) rules for port 443 inbound",
                "4. Verify Azure Virtual Network peering and User Defined Routes (UDRs)",
                "5. Check if corporate firewall/NVA is blocking the connection",
                "6. Manually run: Test-NetConnection -ComputerName $($DnsResult.hostname) -Port 443"
            )
        } else {
            $classification.rootCause = "Public endpoint network path blocked (firewall, proxy, ISP, or regional restriction)"
            $classification.recommendedActions = @(
                "1. Check if corporate firewall is blocking outbound port 443",
                "2. If behind proxy, verify proxy settings allow HTTPS to documents.azure.com",
                "3. Manually run: Test-NetConnection -ComputerName $($DnsResult.hostname) -Port 443",
                "4. Try connecting from a different network to isolate the issue"
            )
        }
        return $classification
    }

    # Both succeeded
    if ($DnsResult.succeeded -and $TcpResult.succeeded) {
        $classification.status = "success"
        $classification.code = "network_connectivity_healthy"
        $classification.summary = "Network connectivity is healthy. DNS resolves and TCP 443 is reachable."
        $classification.rootCause = $null
        $classification.recommendedActions = @(
            "✓ Local network connectivity is working",
            "If Cosmos DB operations still fail, check:",
            "  - RBAC/authentication permissions",
            "  - Account firewall IP rules (if enabled)",
            "  - Data plane token expiry",
            "  - Application-level issues (connection strings, SDK versions)"
        )
        return $classification
    }

    return $classification
}

function Redact-Sensitive {
    param([object]$Object)

    if (-not $Redact) { return $Object }

    $json = $Object | ConvertTo-Json -Depth 10
    $json = $json -replace [regex]::Escape($SubscriptionId.ToString()), "REDACTED-SUBSCRIPTION-ID"
    
    # Redact tenant IDs (GUIDs in certain fields)
    $json = $json -replace '"currentTenant"\s*:\s*"[^"]*"', '"currentTenant": "REDACTED-TENANT-ID"'
    
    # Redact user names
    $json = $json -replace '"currentUser"\s*:\s*"[^"]*"', '"currentUser": "REDACTED-USER-NAME"'
    $json = $json -replace '"principalName"\s*:\s*"[^"]*"', '"principalName": "REDACTED-PRINCIPAL-NAME"'

    return $json | ConvertFrom-Json
}

# ============================================================================
# Main Execution
# ============================================================================

try {
    # Validate and collect inputs
    if ($Interactive -and -not $EndpointUrl) {
        $inputs = Read-InputsInteractively
        $EndpointUrl = $inputs.EndpointUrl
        $SubscriptionId = $inputs.SubscriptionId
        $ResourceGroup = $inputs.ResourceGroup
        $AccountName = $inputs.AccountName
        $PrivateEndpointIP = $inputs.PrivateEndpointIP
        $VpnSubnetRange = $inputs.VpnSubnetRange
    } elseif (-not $EndpointUrl) {
        Write-Host "No endpoint URL provided. Use -Interactive flag or provide parameters." -ForegroundColor Red
        Show-InputInstructions
        exit 1
    }

    # Extract hostname from URL
    $uri = [System.Uri]$EndpointUrl
    $hostname = $uri.Host

    Write-Host "Collecting diagnostics for: $hostname" -ForegroundColor Cyan
    Write-Host ""

    # Run diagnostics
    Write-Host "[1/5] DNS Resolution..." -ForegroundColor Cyan
    $dnsResult = Invoke-DnsResolution -Hostname $hostname

    Write-Host "[2/5] TCP Connectivity (port 443)..." -ForegroundColor Cyan
    $tcpResult = Invoke-TcpConnectivityTest -Hostname $hostname -Port 443 -TimeoutMs $TcpConnectTimeoutMs

    Write-Host "[3/5] HTTPS Probe..." -ForegroundColor Cyan
    $httpsResult = Invoke-HttpsProbe -Url $EndpointUrl

    Write-Host "[4/5] Private Network Analysis..." -ForegroundColor Cyan
    $privateNetIndicators = Get-PrivateNetworkIndicators -ResolvedAddresses $dnsResult.addresses -PrivateEndpointIP $PrivateEndpointIP -VpnSubnetRange $VpnSubnetRange

    Write-Host "[5/5] Azure Configuration & RBAC..." -ForegroundColor Cyan
    $cliContext = Get-AzureCliContext
    $networkConfig = @{ checked = $false; error = "Skipped" }
    $rbacAssessment = @{ checked = $false; classification = "unknown"; error = "Skipped" }
    
    if ($cliContext.authenticated -and $SubscriptionId -and $ResourceGroup -and $AccountName) {
        $networkConfig = Get-AzureAccountNetworkConfig -SubscriptionId $SubscriptionId -ResourceGroup $ResourceGroup -AccountName $AccountName
        $rbacAssessment = Get-RbacAssessment -SubscriptionId $SubscriptionId -ResourceGroup $ResourceGroup -AccountName $AccountName
    } elseif (-not $cliContext.authenticated) {
        Write-Host "  ⚠ Azure CLI not authenticated. Skipping Azure checks. Run 'az login' to enable." -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Generating classification..." -ForegroundColor Cyan
    $classification = Invoke-Classification -DnsResult $dnsResult -TcpResult $tcpResult -PrivateNetworkIndicators $privateNetIndicators -AzureNetworkConfig $networkConfig

    # Build final report
    $report = @{
        version = $ScriptVersion
        timestamp = $DiagnosticTimestamp
        target = @{
            endpointUrl = if ($Redact) { "REDACTED" } else { $EndpointUrl }
            hostname = $hostname
            subscriptionId = if ($Redact -and $SubscriptionId) { "REDACTED" } else { $SubscriptionId.ToString() }
            resourceGroup = if ($Redact -and $ResourceGroup) { "REDACTED" } else { $ResourceGroup }
            accountName = if ($Redact -and $AccountName) { "REDACTED" } else { $AccountName }
        }
        execution = @{
            hostname = [System.Net.Dns]::GetHostName()
            platform = $PSVersionTable.OS
            powershellVersion = $PSVersionTable.PSVersion.ToString()
        }
        diagnostics = @{
            dns = $dnsResult
            tcp = $tcpResult
            https = $httpsResult
            privateNetwork = $privateNetIndicators
            azureNetworkConfig = $networkConfig
            rbac = $rbacAssessment
            azureCli = $cliContext
        }
        classification = $classification
    }

    # Redact if requested
    if ($Redact) {
        $report = Redact-Sensitive -Object $report
    }

    # Output JSON report
    $jsonReport = $report | ConvertTo-Json -Depth 10
    
    # Save to file
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $outputFile = "cosmos-diagnostic-$timestamp.json"
    $jsonReport | Out-File -FilePath $outputFile -Encoding UTF8
    
    Write-Host ""
    Write-Host "═════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "DIAGNOSTIC COMPLETE" -ForegroundColor Green
    Write-Host "═════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  DNS Resolution: $(if ($dnsResult.succeeded) { '✓ PASS' } else { '✗ FAIL' })" 
    Write-Host "  TCP Connectivity: $(if ($tcpResult.succeeded) { '✓ PASS' } else { '✗ FAIL' })"
    Write-Host "  Private Network: $(if ($privateNetIndicators.isPrivateRange) { 'Detected (Private Endpoint)' } else { 'Not Detected (Public Endpoint)' })"
    Write-Host "  Classification: $($classification.status.ToUpper()) - $($classification.code)"
    Write-Host ""
    Write-Host "Full report saved to: $outputFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Yellow
    Write-Host $classification.summary
    Write-Host ""
    if ($classification.recommendedActions.Count -gt 0) {
        Write-Host "Recommended Actions:" -ForegroundColor Yellow
        $classification.recommendedActions | ForEach-Object { Write-Host "  $_" }
    }
    Write-Host ""
    
    # Output JSON to console for easy copy/paste
    Write-Host "Full JSON Report:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────────────────────────────────────"
    Write-Host $jsonReport
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
