/**
 * MSAL COOP Redirect Bridge
 *
 * This page handles the authentication response from the Identity Provider (IdP)
 * and broadcasts it to the main application frame. Required for msal-browser v5+
 * to securely handle auth responses when the IdP sets Cross-Origin-Opener-Policy headers.
 *
 * Security Note: This file must be bundled with your application, NOT loaded from a CDN.
 *
 * CG Alert: MVS-2026-vmmw-f85q
 */
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

broadcastResponseToMainFrame().catch((error: unknown) => {
  console.error("MSAL redirect bridge error:", error);
});
