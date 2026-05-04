// Type declarations for @azure/msal-browser subpath exports
// Required because tsconfig uses moduleResolution: "node" which doesn't support exports field

declare module "@azure/msal-browser/redirect-bridge" {
  /**
   * Processes the authentication response from the redirect URL.
   * For SSO and popup scenarios broadcasts it to the main frame.
   * For redirect scenario navigates to the home page.
   */
  export function broadcastResponseToMainFrame(navigationClient?: unknown): Promise<void>;
}
