# Cosmos DB Connectivity Diagnostic - Classification Matrix & Support Guide

## Classification Decision Tree

```
START: Run diagnostic script
  │
  ├─→ DNS Resolution Check
  │    │
  │    ├─→ ❌ FAILED
  │    │    └─→ Classification: dns_resolution_failed
  │    │         Action: DNS/VPN/proxy troubleshooting
  │    │
  │    └─→ ✓ PASSED
  │         │
  │         ├─→ Resolved IP is RFC 1918 (10.x, 172.16-31.x, 192.168.x)?
  │         │    │
  │         │    ├─→ YES (Private endpoint detected)
  │         │    │    │
  │         │    │    └─→ TCP 443 Test
  │         │    │         │
  │         │    │         ├─→ ❌ FAILED
  │         │    │         │    └─→ private_endpoint_network_path_blocked
  │         │    │         │         (VPN route, NSG, firewall, UDR, peering)
  │         │    │         │
  │         │    │         └─→ ✓ PASSED
  │         │    │              └─→ Check RBAC
  │         │    │
  │         │    └─→ NO (Public endpoint)
  │         │         │
  │         │         └─→ TCP 443 Test
  │         │              │
  │         │              ├─→ ❌ FAILED
  │         │              │    └─→ tcp_connectivity_blocked
  │         │              │         (Firewall, ISP, proxy)
  │         │              │
  │         │              └─→ ✓ PASSED
  │         │                   └─→ network_connectivity_healthy
  │         │
  │         └─→ Check Azure Configuration & RBAC
  │              │
  │              ├─→ Azure CLI authenticated?
  │              │    ├─→ NO → Skip ARM checks, mark warning
  │              │    └─→ YES → Query network config & roles
  │              │
  │              └─→ Sufficient permissions?
  │                   ├─→ NO → rbac_insufficient
  │                   └─→ YES → All checks passed
```

---

## Classification Code Reference

### Success Codes

#### `network_connectivity_healthy`
- **Status:** success
- **When:** DNS resolves AND TCP 443 succeeds
- **Interpretation:** Local network is working. If Cosmos DB operations fail, issue is auth/RBAC/data-plane.
- **Actions:** 
  - Verify RBAC/authentication permissions
  - Check account firewall IP rules
  - Verify data-plane token hasn't expired
  - Check application logs for specific errors

---

### Failure Codes

#### `dns_resolution_failed`
- **Status:** failure
- **When:** DNS lookup fails with SocketException or timeout
- **Interpretation:** Cannot resolve account hostname to any IP
- **Root Causes:**
  - DNS server misconfiguration
  - VPN/proxy intercepting DNS queries
  - Corporate proxy redirecting .documents.azure.com
  - Network unreachable before DNS server
  - ISP DNS failure
- **Actions:**
  1. Check VPN/proxy DNS settings
  2. Run `nslookup <endpoint-hostname>`
  3. Try alternate DNS: `nslookup <endpoint-hostname> 8.8.8.8`
  4. Ping endpoint: `ping <endpoint-hostname>`
  5. Contact network team if no resolution

---

#### `tcp_connectivity_blocked`
- **Status:** failure
- **When:** DNS succeeds BUT TCP 443 fails
- **Interpretation:** Network path blocked between client and endpoint
- **Root Causes (Public Endpoint):**
  - Corporate firewall blocking outbound 443
  - ISP blocking Cosmos/Azure IPs
  - Regional geo-blocking
  - HTTPS inspection proxy interfering
  - Host-level firewall (Windows Defender, etc.)
- **Root Causes (Private Endpoint):**
  - VPN not configured for private endpoint subnet
  - Route not established between VPN subnet and private endpoint subnet
  - NSG rules blocking 443 inbound on PE subnet
  - NVA/firewall dropping packets
  - UDR misconfiguration
  - VNet peering not configured or expired
  - Private DNS zone misconfiguration
- **Actions:**
  1. Run `Test-NetConnection -ComputerName <hostname> -Port 443 -TraceRoute`
  2. If private endpoint: Ask network team to verify VPN routing
  3. Check host firewall (Windows Defender, Mac firewall, Linux iptables)
  4. If corporate proxy: Verify HTTPS inspection not blocking certificates
  5. Try from different network to isolate source

---

#### `private_endpoint_network_path_blocked`
- **Status:** failure
- **When:** Resolved to private IP (10.x, 172.16-31.x, 192.168.x) BUT TCP 443 fails
- **Interpretation:** Private endpoint detected but cannot reach it—network path issue
- **Root Causes:**
  - VPN client subnet → private endpoint subnet routing broken
  - Firewall/NVA blocking internal traffic
  - NSG with restrictive rules on PE subnet
  - UDR pointing to wrong next hop
  - VNet peering not established
  - Private DNS zone not configured or stale
- **Actions:**
  1. Confirm VPN is connected and assigned correct subnet
  2. Ask network team to verify routing: `route print` (Windows) or `netstat -rn` (Linux/Mac)
  3. Check Azure NSG rules on private endpoint subnet for port 443 inbound
  4. Verify private DNS zone has A record pointing to PE IP
  5. Check if VNet peering exists and is Active
  6. Run `Test-NetConnection -ComputerName <pe-ip> -Port 443` directly to PE IP
  7. Provide network team with source IP from script output

---

### Warning Codes

#### `rbac_insufficient`
- **Status:** warning
- **When:** Network OK BUT caller lacks data-plane permissions
- **Interpretation:** Network is healthy, but RBAC prevents data operations
- **Actions:**
  1. Request Cosmos DB Operator or Contributor role assignment
  2. If using connection strings: ensure account hasn't been regenerated
  3. Check data-plane RBAC (if enabled) via Azure CLI: `az role assignment list --scope <account-id>`

---

#### `private_endpoint_mismatch`
- **Status:** warning
- **When:** Resolved IP differs from expected private endpoint IP
- **Interpretation:** Routing may be asymmetric or PE configuration changed
- **Actions:**
  1. Verify private endpoint IP hasn't changed in Azure Portal
  2. Ask network team to check asymmetric routing (DNS from corp vs VPN DNS)
  3. Flush DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

---

#### `azure_config_check_skipped`
- **Status:** warning
- **When:** Azure CLI not authenticated or not installed
- **Interpretation:** Cannot validate ARM-level network config (firewall rules, PE connections)
- **Actions:**
  1. Install Azure CLI: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
  2. Authenticate: `az login`
  3. Re-run script to collect ARM-level diagnostics

---

#### `unknown_error`
- **Status:** failure or warning
- **When:** Unhandled condition or unexpected error
- **Interpretation:** Script encountered something not in the matrix
- **Actions:**
  1. Check script output for error details
  2. Provide full JSON report to support

---

## Support Playbook

### Tier 1: Triage (ICM Responder)

**When customer reports: "Cosmos DB operations return HTTP 0.0 / connection errors"**

1. **Ask customer to run script:**
   ```powershell
   .\Diagnose-CosmosConnectivity.ps1 -Interactive
   ```

2. **Receive JSON output. Check classification.code:**

   | Code | Response |
   |------|----------|
   | `network_connectivity_healthy` | → Escalate to data-plane/auth team. This is not a network issue. |
   | `dns_resolution_failed` | → Run script playbook below |
   | `tcp_connectivity_blocked` (public endpoint) | → Run TCP failed / public endpoint playbook |
   | `private_endpoint_network_path_blocked` | → Run private endpoint playbook |
   | `rbac_insufficient` | → Check RBAC permissions |
   | `azure_config_check_skipped` | → Ask customer to run `az login` and re-run |

3. **Document:**
   - Save JSON report in ICM
   - Note classification code and recommended actions
   - Link to this support guide in response

---

### Playbook: DNS Resolution Failed

**Symptoms:** `dns_resolution_failed` code

**Steps:**

1. **Verify endpoint name with customer:**
   - Check it matches Azure Portal > Cosmos Account > URI
   - Typos are common

2. **Customer self-service:**
   - Ask: "Can you manually run nslookup?"
     ```powershell
     nslookup my-cosmos-account.documents.azure.com
     ```
   - If nslookup fails → Likely VPN/proxy DNS redirect
   - If nslookup succeeds but script fails → Check DNS servers in script output vs nslookup

3. **If behind corporate proxy:**
   - Ask: "Is your traffic routed through a corporate proxy?"
   - If YES: Proxy may be intercepting DNS or blocking .documents.azure.com
   - Action: Customer should contact corporate network team

4. **If using VPN:**
   - Ask: "Does DNS work when you disconnect from VPN?"
   - If YES → VPN DNS redirect issue
   - Action: Customer should contact VPN admin

5. **Escalation:**
   - If all above fail, ask customer to contact their ISP or network provider
   - This is not a Cosmos issue; it's upstream DNS

---

### Playbook: TCP 443 Failed / Public Endpoint

**Symptoms:** `tcp_connectivity_blocked` code with public IP

**Steps:**

1. **Customer runs detailed trace:**
   ```powershell
   Test-NetConnection -ComputerName <hostname> -Port 443 -TraceRoute
   ```

2. **Analyze output:**
   - Does it reach gateway/ISP?
   - Where does it drop?

3. **If corporate network:**
   - Check with network team if 443 outbound is allowed to Azure
   - May need to whitelist docs.microsoft.com or documents.azure.com

4. **If ISP/home network:**
   - Try from mobile hotspot to rule out ISP blocking
   - If hotspot works → ISP is blocking Azure

5. **If Windows Defender Firewall:**
   - Check Windows Defender Firewall for outbound rules
   - Ensure 443 is not blocked

6. **If behind proxy:**
   - Proxy may be doing HTTPS inspection
   - Ask IT if they use SSL Bump/HTTPS Inspection
   - May need to disable inspection for documents.azure.com or accept custom cert

---

### Playbook: Private Endpoint Network Path Blocked

**Symptoms:** `private_endpoint_network_path_blocked` code

**Steps:**

1. **Gather critical info from customer:**
   - Source IP (from script output: `execution.hostname` and `diagnostics.tcp.sourceIp`)
   - Resolved PE IP (from script: `diagnostics.dns.addresses[0]`)
   - Is VPN connected?
   - Which VPN client?

2. **Customer provides to network team:**
   - "TCP from [source-IP] to [PE-IP]:443 is timing out"
   - "Please verify routing from VPN subnet to PE subnet"
   - "Please check NSGs for port 443 inbound on PE subnet"

3. **Network team should check:**
   - Route table: Does VPN subnet have route to PE subnet?
   - NSG: PE subnet NSG allows inbound 443?
   - NVA/Firewall: Any stateful filtering blocking traffic?
   - UDR: Any User Defined Routes sending traffic wrong way?
   - VNet peering: If PE in different VNet, is peering configured?
   - Private DNS: Does private DNS zone have A record for PE IP?

4. **Cosmos team role:**
   - Verify account has private endpoint connection in Approved state
   - Check if PE IP matches what Azure reports
   - Provide PE connection details from Azure Portal

5. **Escalation criteria:**
   - If routing is correct but still fails → May be NSG inside PE subnet (rare)
   - If all checks pass → Escalate to Azure Networking support

---

### Playbook: RBAC Insufficient

**Symptoms:** `rbac_insufficient` code

**Steps:**

1. **Check role assignments:**
   ```powershell
   az role assignment list --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.DocumentDB/databaseAccounts/<account>
   ```

2. **Assign appropriate role:**
   - Cosmos DB Operator (read/write data)
   - Cosmos DB Account Reader (read-only)
   - Contributor or Owner (full management)

3. **If using master key:**
   - Primary/secondary keys are still valid if account hasn't been regenerated
   - Ask: Has the account been regenerated recently?
   - If yes, old keys won't work

---

## JSON Parsing for Automation

### Python Example (Support Bot)

```python
import json

def parse_cosmos_diagnostic(json_data):
    report = json.loads(json_data)
    
    classification = report.get("classification", {})
    code = classification.get("code")
    status = classification.get("status")
    
    # Route based on code
    if code == "network_connectivity_healthy":
        return "Escalate: Auth/RBAC team"
    elif code == "dns_resolution_failed":
        return "Run DNS playbook"
    elif code == "tcp_connectivity_blocked":
        endpoint = report["target"]["endpointUrl"]
        if "10." in report["diagnostics"]["dns"]["addresses"][0]:
            return "Run Private Endpoint playbook"
        else:
            return "Run TCP Failure / Public Endpoint playbook"
    elif code == "private_endpoint_network_path_blocked":
        return "Run Private Endpoint playbook"
    elif code == "rbac_insufficient":
        return "Check RBAC: " + str(report["diagnostics"]["rbac"]["roleAssignments"])
    else:
        return "Unknown code: " + code
```

### Support Ticket Template

```
COSMOS DB CONNECTIVITY ISSUE - DIAGNOSTIC RECEIVED

Classification: [classification.code]
Status: [classification.status]
Summary: [classification.summary]

Network Diagnostics:
  DNS Resolution: [diagnostics.dns.succeeded]
  TCP 443 Connectivity: [diagnostics.tcp.succeeded]
  HTTPS Reachability: [diagnostics.https.statusCode]
  Private Endpoint: [diagnostics.privateNetwork.isPrivateRange]

Azure Configuration:
  Public Network Restricted: [diagnostics.azureNetworkConfig.publicNetworkAccessRestricted]
  Private Endpoints: [diagnostics.azureNetworkConfig.privateEndpoints.length] configured
  
RBAC Status:
  Classification: [diagnostics.rbac.classification]
  Can Read Account: [diagnostics.rbac.canReadAccount]
  Can Manage Account: [diagnostics.rbac.canManageAccount]

Recommended Actions:
[classification.recommendedActions joined with newlines]

Next Step:
[routing based on classification.code]
```

---

## References

- [Azure Cosmos DB Troubleshoot Connectivity Issues](https://learn.microsoft.com/en-us/azure/cosmos-db/troubleshoot-connection)
- [Private Endpoints for Azure Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/how-to-configure-private-endpoints)
- [Network Security Groups](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
- [User Defined Routes](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview)
