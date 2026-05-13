# Cosmos DB Connectivity Diagnostic - Quick Reference

## 🚀 Quick Start (2 Minutes)

### Step 1: Gather Your Info

| Item | Where to Find |
|------|---|
| **Endpoint URL** | Azure Portal → Cosmos DB Account → Overview → URI field |
| **Subscription ID** | Azure Portal → Subscriptions → Copy ID |
| **Resource Group** | Azure Portal → Cosmos DB Account → Top-right "Resource group" |
| **Account Name** | From endpoint URL (the part before `.documents.azure.com`) |

### Step 2: Run the Script

**Interactive (easiest):**
```powershell
.\Diagnose-CosmosConnectivity.ps1 -Interactive
```
Script will prompt for inputs and guide you.

**Non-interactive:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://my-cosmos.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "my-rg" `
  -AccountName "my-cosmos"
```

**With redaction (safe for support):**
```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://my-cosmos.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "my-rg" `
  -AccountName "my-cosmos" `
  -Redact
```

### Step 3: Check Result

Look for the **Classification** line:

```
Classification: SUCCESS - network_connectivity_healthy
```

---

## 📊 Result Codes

| Code | Meaning | Action |
|------|---------|--------|
| ✅ `network_connectivity_healthy` | Network OK | Check auth/RBAC if operations still fail |
| ❌ `dns_resolution_failed` | Cannot find hostname | Check VPN/proxy DNS settings |
| ❌ `tcp_connectivity_blocked` | DNS works, but port 443 blocked | Ask network team to check firewall |
| ❌ `private_endpoint_network_path_blocked` | Private endpoint unreachable | Ask network team to check PE routing |
| ⚠️ `rbac_insufficient` | Not enough permissions | Ask admin for Cosmos DB Operator role |
| ⚠️ `azure_config_check_skipped` | Azure CLI not set up | Run `az login` and re-run |

---

## 🆘 Common Fixes

### DNS Resolution Failed
1. Are you on a VPN? → Ask VPN admin about DNS settings
2. Check manually: `nslookup my-cosmos-account.documents.azure.com`
3. Try different DNS: `nslookup my-cosmos-account.documents.azure.com 8.8.8.8`

### TCP 443 Blocked (Public Endpoint)
1. Check Windows Firewall (Windows Defender) settings
2. If on corporate network → Ask IT if 443 outbound is allowed
3. Try from mobile hotspot to test

### TCP 443 Blocked (Private Endpoint)
1. Verify VPN is connected
2. Ask network team to check NSG and routing rules
3. Provide them with the script output (use `-Redact` to mask sensitive data)

### RBAC Insufficient
1. Ask admin to assign you **"Cosmos DB Operator"** role
2. Wait 5-10 minutes for role assignment to propagate

---

## 📁 Output Files

**JSON Report:** `cosmos-diagnostic-<timestamp>.json`
- Full diagnostic results
- Save for your records
- Can share with support (use `-Redact` first)

---

## ⚙️ Prerequisites

- PowerShell 5.0+ (Windows, Mac, Linux)
- Network access to documents.azure.com
- (Optional) Azure CLI for full diagnostics: `az login`

---

## 💡 Tips

**Private Endpoint?** Include the IP:
```powershell
.\Diagnose-CosmosConnectivity.ps1 -Interactive -PrivateEndpointIP "10.123.171.30"
```

**Sharing with support safely:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 ... -Redact
# Share the JSON file (sensitive data masked)
```

**Just want DNS/TCP without Azure checks:**
- Run without providing SubscriptionId/ResourceGroup/AccountName
- Or don't run `az login` first

---

## 📞 Getting Help

**If you see:**
- ✅ Green checkmarks → Network is working. Issue is likely application-level.
- ❌ Red X marks → Network is blocked. Share the JSON with support.
- ⚠️ Yellow warnings → Configuration issue. Follow recommended actions.

**Next:** Share your JSON report with support and include the **Classification Code**.

---

## 📋 Checklist Before Contacting Support

- [ ] I ran the script successfully
- [ ] I noted the **Classification Code** (from console output)
- [ ] I checked the **Recommended Actions** section
- [ ] I tried the basic fixes above
- [ ] I saved the JSON report

---

**Version:** 1.0.0 | **Last Updated:** 2026-05-13
