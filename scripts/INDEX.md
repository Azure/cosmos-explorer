# Cosmos DB Connectivity Diagnostic - Complete Documentation Index

## 📦 Deliverables

This folder contains a complete, production-ready diagnostic toolkit for troubleshooting Cosmos DB connectivity issues. Below is a guide to all files and their purpose.

---

## 📚 Documentation Files

### 1. **README.md** ← Start here
**Purpose:** Comprehensive usage guide for customers and support teams

**Contains:**
- Overview and features
- Quick start in 3 modes (interactive, non-interactive, with redaction)
- Step-by-step guide to finding all inputs
- Understanding output format
- Common scenarios and examples
- Integration examples
- Troubleshooting guide
- Troubleshooting common issues

**Read this if:** You're running the script for the first time or onboarding someone else

---

### 2. **QUICK_REFERENCE.md** ← For urgent issues
**Purpose:** 2-minute quick-start card for customers

**Contains:**
- 3-step quick start
- Result codes at a glance
- Common fixes
- Prerequisite checklist

**Read this if:** You need to run the script NOW and don't have time for full docs

---

### 3. **DIAGNOSTIC_SCHEMA.md** ← For developers/automation
**Purpose:** Complete JSON output specification

**Contains:**
- Full JSON schema with field descriptions
- Root, target, execution, diagnostics, and classification objects
- DNS/TCP/HTTPS/private network result formats
- Azure config and RBAC object structures
- Classification code reference table
- Sample outputs for 3 scenarios
- Parsing guidelines
- Version history

**Read this if:**
- You're building a parser or automation tool
- You need to understand the JSON structure
- You're integrating with support ticketing system
- You want to validate output structure

---

### 4. **CLASSIFICATION_MATRIX.md** ← For support teams
**Purpose:** Support playbooks and triage routing

**Contains:**
- Decision tree flowchart (ASCII art)
- All classification codes with detailed explanations
- Root causes and recommended actions for each code
- Tier 1 triage checklist
- Detailed playbooks for each failure scenario:
  - DNS Resolution Failed
  - TCP 443 Failed (Public Endpoint)
  - TCP 443 Failed (Private Endpoint)
  - RBAC Insufficient
- Support ticket template
- Python parsing example
- Automation routing matrix

**Read this if:**
- You're a support engineer receiving diagnostic reports
- You need to route issues based on classification
- You're building automation to process diagnostics
- You need to escalate to specialist teams

---

## 🔧 Script File

### **Diagnose-CosmosConnectivity.ps1**
**Purpose:** Main diagnostic script (customer-executable)

**What it does:**
1. Prompts for account endpoints and credentials (interactive or parameterized)
2. Runs 5 diagnostic checks:
   - DNS resolution of account endpoint
   - TCP 443 connectivity test
   - HTTPS reachability probe
   - Private network indicators analysis
   - Azure CLI queries (if authenticated)
3. Performs RBAC assessment
4. Generates classification (success/failure/warning + specific code)
5. Outputs structured JSON to file and console
6. Produces human-readable summary with recommended actions

**Key Features:**
- 300+ lines of well-commented PowerShell
- Error handling for all network operations
- Timeouts to prevent hanging
- Optional sensitive data redaction
- Works on Windows, macOS, Linux (PowerShell 5.0+)
- No external dependencies except optional Azure CLI

**How to run:**
```powershell
# Interactive (recommended first run)
.\Diagnose-CosmosConnectivity.ps1 -Interactive

# Non-interactive (scripted)
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "..." -SubscriptionId "..." -ResourceGroup "..." -AccountName "..."

# Safe for support (redacted)
.\Diagnose-CosmosConnectivity.ps1 ... -Redact
```

---

## 🔄 File Relationships

```
Customer Issue: "Can't connect to Cosmos DB"
     │
     ├─→ QUICK_REFERENCE.md (if in hurry)
     │        │
     │        └─→ "Run this command"
     │
     └─→ README.md (comprehensive guidance)
              │
              ├─→ Run: Diagnose-CosmosConnectivity.ps1
              │        │
              │        └─→ Outputs JSON file + console summary
              │
              ├─→ Read classification code
              │
              └─→ CLASSIFICATION_MATRIX.md (support playbook)
                       │
                       ├─→ Find your classification code
                       │
                       ├─→ Read root causes
                       │
                       └─→ Follow recommended actions
                              │
                              ├─→ Self-resolve?
                              │        └─→ Done! 
                              │
                              └─→ Still stuck?
                                     │
                                     ├─→ Gather info from JSON
                                     │
                                     ├─→ Redact with -Redact flag
                                     │
                                     └─→ Escalate to support
                                            │
                                            ├─→ Support triages with CLASSIFICATION_MATRIX.md
                                            │
                                            └─→ Route to specialist (network, auth, etc.)
```

---

## 🎯 Usage by Role

### 👤 Customer / End User
1. Read: **QUICK_REFERENCE.md** (2 min)
2. Gather inputs as shown in README.md
3. Run: `.\Diagnose-CosmosConnectivity.ps1 -Interactive`
4. Review output—look for Classification Code
5. Try recommended actions from console output
6. If stuck → Share JSON with support (use `-Redact`)

### 👨‍💼 Support Engineer (Tier 1)
1. Receive JSON report from customer
2. Read: **CLASSIFICATION_MATRIX.md** section "Tier 1: Triage"
3. Look up classification.code in "Classification Code Reference"
4. Follow the corresponding playbook
5. Either self-resolve or route to specialist

### 👨‍💻 Support Engineer (Specialist)
1. Receive routed issue with JSON and escalation context
2. Read relevant playbook from **CLASSIFICATION_MATRIX.md**
3. Use **DIAGNOSTIC_SCHEMA.md** to parse specific JSON fields
4. Reference "Recommended Actions" for deep-dive steps
5. May request customer to re-run with additional parameters

### 🤖 Automation / Integration
1. Read: **DIAGNOSTIC_SCHEMA.md** (schema specification)
2. Parse JSON output from script
3. Route based on classification.code
4. (Optional) Read **CLASSIFICATION_MATRIX.md** section "JSON Parsing for Automation"
5. Integrate with ticketing, routing, or remediation system

### 📊 Product Team / Data Analysis
1. Collect diagnostic reports over time
2. Aggregate classification codes to identify trends
3. Use JSON structure to extract metrics (DNS latency, TCP success rate, etc.)
4. Reference **DIAGNOSTIC_SCHEMA.md** for field definitions
5. Correlate with support ticket data for insights

---

## 📋 Classification Codes at a Glance

Quick reference (full details in CLASSIFICATION_MATRIX.md):

| Code | Type | Severity | What It Means |
|------|------|----------|---|
| `network_connectivity_healthy` | ✅ | Info | Network works; if still broken, check auth/app |
| `dns_resolution_failed` | ❌ | High | Cannot resolve endpoint (DNS/VPN/proxy issue) |
| `tcp_connectivity_blocked` | ❌ | High | DNS works, port 443 blocked (firewall/ISP) |
| `private_endpoint_network_path_blocked` | ❌ | High | Private endpoint unreachable (PE routing issue) |
| `rbac_insufficient` | ⚠️ | Medium | Network OK, but permissions missing |
| `private_endpoint_mismatch` | ⚠️ | Medium | Resolved to unexpected private IP |
| `azure_config_check_skipped` | ⚠️ | Low | Azure CLI not authenticated; re-run after `az login` |

---

## 🔍 Finding Specific Information

### "I want to know what the JSON contains"
→ **DIAGNOSTIC_SCHEMA.md** (all field definitions)

### "I see a classification code, what does it mean?"
→ **CLASSIFICATION_MATRIX.md** (code reference + playbook)

### "How do I run the script?"
→ **README.md** (detailed how-to) or **QUICK_REFERENCE.md** (2-min version)

### "I'm building a parser/bot"
→ **DIAGNOSTIC_SCHEMA.md** (schema + samples) + **CLASSIFICATION_MATRIX.md** (routing logic)

### "I need to support multiple customers"
→ **CLASSIFICATION_MATRIX.md** (support ticket template + triage playbook)

### "I need to find input for a specific field"
→ **README.md** section "Getting Your Inputs" (step-by-step with screenshots reference)

### "How do I integrate this into my system?"
→ **DIAGNOSTIC_SCHEMA.md** (JSON structure) + **CLASSIFICATION_MATRIX.md** (routing + Python example)

---

## ✅ Pre-Launch Checklist

Before deploying to customers, verify:

- [ ] Script runs without errors in interactive mode
- [ ] Script accepts all parameters in non-interactive mode
- [ ] `-Redact` flag properly masks sensitive data
- [ ] JSON output validates against DIAGNOSTIC_SCHEMA.md
- [ ] All classification codes match CLASSIFICATION_MATRIX.md
- [ ] README.md examples tested and working
- [ ] Support team trained on CLASSIFICATION_MATRIX.md playbooks
- [ ] Triage automation configured (if applicable)
- [ ] Sample JSON files created and tested
- [ ] Accessibility verified (screen readers, etc.)

---

## 🚀 Rollout Plan

### Phase 1: Internal Testing (Week 1)
- [ ] Run script on various network configurations
- [ ] Test interactive and non-interactive modes
- [ ] Verify Azure CLI integration (if connected to test accounts)
- [ ] Collect sample JSON outputs

### Phase 2: Support Dogfood (Week 2)
- [ ] Train support team on using CLASSIFICATION_MATRIX.md
- [ ] Have support team run diagnostics on internal test accounts
- [ ] Collect feedback on documentation clarity
- [ ] Refine playbooks based on real cases

### Phase 3: Limited Release (Week 3)
- [ ] Release to subset of customers (e.g., preview tier)
- [ ] Gather feedback on usability
- [ ] Monitor classification code distribution
- [ ] Look for unexpected errors or edge cases

### Phase 4: General Availability (Week 4)
- [ ] Release to all customers
- [ ] Monitor issue volume and classification codes
- [ ] Use data to identify new playbooks or improvements
- [ ] Update documentation based on feedback

---

## 📞 Support & Maintenance

### Common Questions

**Q: Can I run the script without Azure CLI?**
A: Yes! It will skip Azure configuration checks but still do network diagnostics.

**Q: Is the script safe? Does it collect personal data?**
A: Safe. It only reads local network config and (optionally) queries Azure API if you're authenticated. Use `-Redact` to mask sensitive data before sharing.

**Q: What if I get an unexpected error?**
A: Check error message in console, review troubleshooting section in README.md, or share the JSON file with support.

**Q: How often should I re-run diagnostics?**
A: After network changes, VPN reconnect, or when troubleshooting intermittent issues.

---

## 📈 Success Metrics

Track these to measure script effectiveness:

- % of customers who run script on first issue
- % of issues self-resolved after reading recommended actions
- Reduction in escalations for network vs auth vs app issues
- Average time to triage (before: manual back-and-forth; after: automated)
- Distribution of classification codes (helps identify common issues)

---

## 🔄 Version & Updates

**Current Version:** 1.0.0  
**Schema Version:** 1.0.0  
**Last Updated:** 2026-05-13

**Versioning Policy:**
- Major version (1.x.x) = Breaking changes to JSON schema or classification codes
- Minor version (x.1.x) = New checks or optional fields added
- Patch version (x.x.1) = Bug fixes, documentation updates

---

## 📄 License & Attribution

All files in this directory are provided as-is for Cosmos DB connectivity diagnostics.
See repository LICENSE file for terms.

---

**Quick Links:**
- 🚀 [Quick Start](./QUICK_REFERENCE.md)
- 📖 [Full Documentation](./README.md)
- 🔧 [Script](./Diagnose-CosmosConnectivity.ps1)
- 🗂️ [JSON Schema](./DIAGNOSTIC_SCHEMA.md)
- 📋 [Support Playbooks](./CLASSIFICATION_MATRIX.md)
