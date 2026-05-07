import * as msal from "@azure/msal-browser";
import { getEnvironmentScopeEndpoint } from "Common/EnvironmentUtility";
import { Action, ActionModifiers } from "Shared/Telemetry/TelemetryConstants";
import { hasProxyServer, isDataplaneRbacSupported } from "Utils/APITypeUtils";
import { AuthType } from "../AuthType";
import * as Constants from "../Common/Constants";
import * as Logger from "../Common/Logger";
import { configContext } from "../ConfigContext";
import { DatabaseAccount } from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import { isExpectedError } from "../Metrics/ErrorClassification";
import { scenarioMonitor } from "../Metrics/ScenarioMonitor";
import { trace, traceFailure, traceStart, traceSuccess } from "../Shared/Telemetry/TelemetryProcessor";
import { UserContext, userContext } from "../UserContext";

export function getAuthorizationHeader(): ViewModels.AuthorizationTokenHeaderMetadata {
  if (userContext.authType === AuthType.EncryptedToken) {
    return {
      header: Constants.HttpHeaders.guestAccessToken,
      token: userContext.accessToken,
    };
  } else {
    return {
      header: Constants.HttpHeaders.authorization,
      token: userContext.authorizationToken || "",
    };
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function decryptJWTToken(token: string) {
  if (!token) {
    Logger.logError("Cannot decrypt token: No JWT token found", "AuthorizationUtils/decryptJWTToken");
    throw new Error("No JWT token found");
  }
  const tokenParts = token.split(".");
  if (tokenParts.length < 2) {
    Logger.logError(`Invalid JWT token: ${token}`, "AuthorizationUtils/decryptJWTToken");
    throw new Error(`Invalid JWT token: ${token}`);
  }
  let tokenPayloadBase64: string = tokenParts[1];
  tokenPayloadBase64 = tokenPayloadBase64.replace(/-/g, "+").replace(/_/g, "/");
  const tokenPayload = decodeURIComponent(
    atob(tokenPayloadBase64)
      .split("")
      .map((p) => "%" + ("00" + p.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );

  return JSON.parse(tokenPayload);
}

export function getRedirectBridgeUrl(): string {
  if (process.env.NODE_ENV === "development") {
    return "https://dataexplorer-dev.azurewebsites.net/redirectBridge.html";
  }
  const basePath = window.location.pathname.startsWith("/mpac/") ? "/mpac" : "";
  return `${window.location.origin}${basePath}/redirectBridge.html`;
}

export function getPostLogoutRedirectUrl(): string {
  if (process.env.NODE_ENV === "development") {
    return "https://dataexplorer-dev.azurewebsites.net/hostedExplorer.html";
  }
  const basePath = window.location.pathname.startsWith("/mpac/") ? "/mpac" : "";
  return `${window.location.origin}${basePath}`;
}

export async function getMsalInstance() {
  // Compute the redirect bridge URL for MSAL v5 COOP handling
  const redirectBridgeUrl = getRedirectBridgeUrl();

  const msalConfig: msal.Configuration = {
    cache: {
      cacheLocation: "localStorage",
    },
    auth: {
      authority: `${configContext.AAD_ENDPOINT}organizations`,
      clientId: "203f1145-856a-4232-83d4-a43568fba23d",
      // MSAL v5 requires redirect bridge for popup/silent flows
      redirectUri: redirectBridgeUrl,
    },
  };

  const msalInstance = new msal.PublicClientApplication(msalConfig);
  // v3+ requires explicit initialization before using MSAL APIs
  await msalInstance.initialize();
  // Handle any redirect response (e.g., after acquireTokenRedirect or logoutRedirect).
  // When returning from a redirect-based auth flow, this resolves the auth result and
  // caches the token so that subsequent acquireTokenSilent calls succeed.
  const redirectResponse = await msalInstance.handleRedirectPromise();
  if (redirectResponse?.account) {
    msalInstance.setActiveAccount(redirectResponse.account);
  }
  return msalInstance;
}

export async function acquireMsalTokenForAccount(
  account: DatabaseAccount,
  silent: boolean = false,
  user_hint?: string,
) {
  const msalStartKey = traceStart(Action.AcquireMsalToken, {
    acquireTokenType: silent ? "silent" : "interactive",
  });
  if (userContext.databaseAccount.properties?.documentEndpoint === undefined) {
    traceFailure(Action.AcquireMsalToken, { error: "No document endpoint" }, msalStartKey);
    throw new Error("Database account has no document endpoint defined");
  }
  let hrefEndpoint = "";
  if (isDataplaneRbacEnabledForProxyApi(userContext)) {
    hrefEndpoint = getEnvironmentScopeEndpoint();
  } else {
    hrefEndpoint = new URL(userContext.databaseAccount.properties.documentEndpoint).href.replace(/\/+$/, "/.default");
  }
  const msalInstance = await getMsalInstance();
  const knownAccounts = msalInstance.getAllAccounts();
  // If user_hint is provided, we will try to use it to find the account.
  // If no account is found, we will use the current active account or first account in the list.
  const msalAccount =
    knownAccounts?.filter((account) => account.username === user_hint)[0] ??
    msalInstance.getActiveAccount() ??
    knownAccounts?.[0];

  if (!msalAccount) {
    // If no account was found, we need to sign in.
    // This will eventually throw InteractionRequiredAuthError if silent is true, we won't handle it here.
    const loginRequest = {
      scopes: [hrefEndpoint],
      loginHint: user_hint ?? userContext.userName,
      authority: userContext.tenantId ? `${configContext.AAD_ENDPOINT}${userContext.tenantId}` : undefined,
    };
    try {
      if (silent) {
        // We can try to use SSO between different apps to avoid showing a popup.
        // With a hint provided, this should work in most cases.
        // See https://learn.microsoft.com/en-us/entra/identity-platform/msal-js-sso#sso-between-different-apps
        try {
          const loginResponse = await msalInstance.ssoSilent(loginRequest);
          traceSuccess(Action.AcquireMsalToken, { method: "ssoSilent" }, msalStartKey);
          return loginResponse.accessToken;
        } catch (silentError) {
          trace(Action.SignInAad, ActionModifiers.Mark, {
            request: JSON.stringify(loginRequest),
            acquireTokenType: silent ? "silent" : "interactive",
            errorMessage: JSON.stringify(silentError),
          });
        }
      }
      // If silent acquisition failed, we need to show a popup.
      // Passing prompt: "none" will still show a popup but not perform a full sign-in.
      // This will only work if the user has already signed in and the session is still valid.
      // See https://learn.microsoft.com/en-us/entra/identity-platform/msal-js-prompt-behavior#interactive-requests-with-promptnone
      // The hint will be used to pre-fill the username field in the popup if silent is false.
      const loginResponse = await msalInstance.loginPopup({ prompt: silent ? "none" : "login", ...loginRequest });
      traceSuccess(Action.AcquireMsalToken, { method: "loginPopup" }, msalStartKey);
      return loginResponse.accessToken;
    } catch (error) {
      traceFailure(Action.SignInAad, {
        request: JSON.stringify(loginRequest),
        acquireTokenType: silent ? "silent" : "interactive",
        errorMessage: JSON.stringify(error),
      });
      traceFailure(Action.AcquireMsalToken, { error: JSON.stringify(error) }, msalStartKey);
      // Mark expected failure for health metrics so timeout emits healthy
      if (isExpectedError(error)) {
        scenarioMonitor.markExpectedFailure();
      }
      throw error;
    }
  } else {
    msalInstance.setActiveAccount(msalAccount);
  }

  const tokenRequest = {
    account: msalAccount ?? undefined,
    forceRefresh: true,
    scopes: [hrefEndpoint],
    loginHint: user_hint ?? userContext.userName,
    authority: `${configContext.AAD_ENDPOINT}${userContext.tenantId ?? msalAccount.tenantId}`,
  };
  return acquireTokenWithMsal(msalInstance, tokenRequest, silent);
}

export async function acquireTokenWithMsal(
  msalInstance: msal.IPublicClientApplication,
  request: msal.SilentRequest,
  silent: boolean = false,
) {
  const tokenRequest = {
    account: msalInstance.getActiveAccount() ?? undefined,
    ...request,
  };

  try {
    // attempt silent acquisition first
    const token = (await msalInstance.acquireTokenSilent(tokenRequest)).accessToken;
    return token;
  } catch (silentError) {
    if (silentError instanceof msal.InteractionRequiredAuthError && silent === false) {
      // Sovereign cloud environments (e.g., Azure China / Mooncake) block popups in some
      // browser configurations. Use redirect-based flow instead to ensure compatibility.
      // Detection is based on configContext.AAD_ENDPOINT (set from the portal's serverId message
      // via updateAADEndpoints), NOT window.location.host — the latter is unreliable when running
      // the explorer locally (localhost) embedded inside portal.azure.cn.
      const isMooncake = configContext.AAD_ENDPOINT === Constants.AadEndpoints.Mooncake;
      if (isMooncake) {
        try {
          // acquireTokenRedirect navigates the browser away; execution does not continue
          // past this await. On return, getMsalInstance()'s handleRedirectPromise() will
          // cache the token so the next acquireTokenSilent call succeeds.
          await msalInstance.acquireTokenRedirect(tokenRequest);
          // This line is never reached in practice because the browser has navigated away.
          return "";
        } catch (redirectError) {
          traceFailure(Action.SignInAad, {
            request: JSON.stringify(tokenRequest),
            acquireTokenType: "redirect",
            errorMessage: JSON.stringify(redirectError),
          });
          if (isExpectedError(redirectError)) {
            scenarioMonitor.markExpectedFailure();
          }
          throw redirectError;
        }
      }
      try {
        // Non-mooncake: use popup-based interactive acquisition.
        return (await msalInstance.acquireTokenPopup(tokenRequest)).accessToken;
      } catch (interactiveError) {
        traceFailure(Action.SignInAad, {
          request: JSON.stringify(tokenRequest),
          acquireTokenType: "interactive",
          errorMessage: JSON.stringify(interactiveError),
        });
        // Mark expected failure for health metrics so timeout emits healthy
        if (isExpectedError(interactiveError)) {
          scenarioMonitor.markExpectedFailure();
        }
        throw interactiveError;
      }
    } else {
      traceFailure(Action.SignInAad, {
        request: JSON.stringify(tokenRequest),
        acquireTokenType: "silent",
        errorMessage: JSON.stringify(silentError),
      });
      // Mark expected failure for health metrics so timeout emits healthy
      if (isExpectedError(silentError)) {
        scenarioMonitor.markExpectedFailure();
      }
      throw silentError;
    }
  }
}

export function useDataplaneRbacAuthorization(userContext: UserContext): boolean {
  return (
    userContext.features?.enableAadDataPlane ||
    (userContext.dataPlaneRbacEnabled && isDataplaneRbacSupported(userContext.apiType))
  );
}

export function isDataplaneRbacEnabledForProxyApi(userContext: UserContext): boolean {
  return useDataplaneRbacAuthorization(userContext) && hasProxyServer(userContext.apiType);
}
