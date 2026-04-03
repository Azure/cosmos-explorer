---
name: dev-server
description: Start the local webpack dev server and connect to it with the Playwright browser. Use this skill when asked to start the dev server, preview the app, or interact with the running application in a browser.
allowed-tools: shell, browser
---

# Dev Server Skill

Use this skill to start the Cosmos Explorer webpack dev server and connect to it with the Playwright MCP browser for interactive testing, debugging, or previewing the application.

## Pre-Start: Check Dependencies

Before starting the dev server, check whether `npm install` needs to be run:

```bash
if [ ! -d node_modules ] || [ package.json -nt node_modules ] || [ package-lock.json -nt node_modules ]; then
  npm install
fi
```

On Windows PowerShell:

```powershell
if (-not (Test-Path node_modules) -or
    (Get-Item package.json).LastWriteTime -gt (Get-Item node_modules).LastWriteTime -or
    (Get-Item package-lock.json).LastWriteTime -gt (Get-Item node_modules).LastWriteTime) {
    npm install
}
```

Always run this check before starting the dev server.

## Check for Existing Server

Before starting a new server, check if one is already running on port 1234:

```powershell
try {
    $response = Invoke-WebRequest -Uri "https://localhost:1234/_ready" -SkipCertificateCheck -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "Dev server is already running and ready!"
    }
} catch {
    Write-Host "No dev server detected, starting a new one..."
}
```

If the server is already running and ready, skip to **Connect the Playwright Browser**.

## Start the Dev Server

Start the webpack dev server as a **detached background process** so it persists across session changes:

```bash
npm start
```

The dev server:
- Runs at **`https://localhost:1234`** (HTTPS with self-signed certificate)
- Uses webpack dev mode with live reload
- Exposes a `/_ready` health-check endpoint

## Wait for Compilation

After starting the server, poll the `/_ready` endpoint until it returns HTTP 200. **Do not proceed to browser navigation until `/_ready` returns 200.**

On Windows PowerShell:

```powershell
$timeout = 120
$elapsed = 0
while ($elapsed -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:1234/_ready" -SkipCertificateCheck -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "Dev server is ready!"
            break
        }
    } catch {
        # Server not ready yet
    }
    Start-Sleep -Seconds 3
    $elapsed += 3
}
if ($elapsed -ge $timeout) {
    Write-Error "Dev server did not become ready within $timeout seconds"
}
```

On bash:

```bash
timeout=120
elapsed=0
while [ $elapsed -lt $timeout ]; do
  if curl -sk https://localhost:1234/_ready 2>/dev/null | grep -q "Compilation complete"; then
    echo "Dev server is ready!"
    break
  fi
  sleep 3
  elapsed=$((elapsed + 3))
done
if [ $elapsed -ge $timeout ]; then
  echo "Dev server did not become ready within $timeout seconds" >&2
fi
```

## Connect the Playwright Browser

Once the dev server is ready, use the Playwright MCP browser tools to navigate to the application.

Navigate to the desired entry point:

- **`https://localhost:1234/hostedExplorer.html`** — Hosted explorer (standalone mode). Best for general UI testing and interaction without Azure Portal framing.
- **`https://localhost:1234/explorer.html`** — Portal explorer (Azure Portal iframe mode). Requires portal context/messages to initialize fully.
- **`https://localhost:1234/index.html`** — Emulator mode. Requires a local Cosmos DB Emulator running on port 8081.
- **`https://localhost:1234/testExplorer.html`** — Test explorer (dev mode only). Used for E2E test harness.

### Default Navigation

When no specific page is requested, navigate to **`https://localhost:1234/hostedExplorer.html`** as it provides the most complete standalone experience.

### Dismiss Webpack Warnings Overlay

After the page loads, a webpack dev server overlay may appear inside an iframe showing `DefinePlugin` warnings. If a "Dismiss" button (`×`) is visible in the overlay, click it to close the warnings before proceeding with any other interaction.

## Available Pages Reference

| URL | Entry Point | Description |
|-----|-------------|-------------|
| `/hostedExplorer.html` | `src/HostedExplorer.tsx` | Standalone hosted explorer (cosmos.azure.com) |
| `/explorer.html` | `src/Main.tsx` | Portal iframe explorer |
| `/index.html` | `src/Index.tsx` | Emulator explorer |
| `/testExplorer.html` | `test/testExplorer/TestExplorer.ts` | Test harness (dev mode only) |
| `/terminal.html` | `src/Terminal/index.ts` | Notebook terminal |
| `/quickstart.html` | `src/quickstart.ts` | Quickstart page |
| `/selfServe.html` | `src/SelfServe/SelfServe.tsx` | Self-serve configuration |
| `/galleryViewer.html` | `src/GalleryViewer/GalleryViewer.tsx` | Notebook gallery viewer |

## Troubleshooting

### HTTPS / Self-Signed Certificate Errors

The dev server uses HTTPS with a self-signed certificate. If the Playwright browser fails to navigate with an error like `ERR_CERT_AUTHORITY_INVALID` or any other SSL/TLS certificate error, **stop immediately** and tell the user:

> The Playwright MCP server needs the `--ignore-https-errors` argument to connect to the dev server's self-signed certificate. Please add `--ignore-https-errors` to your Playwright MCP server configuration and try again.

Do not attempt workarounds (e.g., creating new browser contexts manually). The `--ignore-https-errors` flag is the correct fix.

## Guidelines

- Always start the dev server as a **detached background process** so it survives session changes.
- Always wait for `/_ready` to return 200 before navigating the browser.
- Ignore certificate errors in shell HTTP requests (e.g., `-SkipCertificateCheck`, `curl -k`). For the Playwright browser, the `--ignore-https-errors` MCP argument must be configured.
- If the dev server is already running on port 1234, reuse it instead of starting a new one.
- If the server fails to start, check for port conflicts (`netstat -ano | findstr :1234` on Windows).
- When stopping the dev server, use `Stop-Process` with the specific PID of the node process.
