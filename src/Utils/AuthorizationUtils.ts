import * as msal from "@azure/msal-browser";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { AuthType } from "../AuthType";
import * as Constants from "../Common/Constants";
import * as Logger from "../Common/Logger";
import { configContext } from "../ConfigContext";
import { DatabaseAccount } from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import { traceFailure } from "../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../UserContext";

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

export async function getMsalInstance() {
  const msalConfig: msal.Configuration = {
    cache: {
      cacheLocation: "localStorage",
    },
    auth: {
      authority: `${configContext.AAD_ENDPOINT}organizations`,
      clientId: "203f1145-856a-4232-83d4-a43568fba23d",
    },
  };

  if (process.env.NODE_ENV === "development") {
    msalConfig.auth.redirectUri = "https://dataexplorer-dev.azurewebsites.net";
  }

  const msalInstance = new msal.PublicClientApplication(msalConfig);
  return msalInstance;
}

export async function acquireMsalTokenForAccount(account: DatabaseAccount, silent: boolean = false) {
  if (userContext.databaseAccount.properties?.documentEndpoint === undefined) {
    throw new Error("Database account has no document endpoint defined");
  }
  const hrefEndpoint = new URL(userContext.databaseAccount.properties.documentEndpoint).href.replace(
    /\/$/,
    "/.default",
  );
  const msalInstance = await getMsalInstance();
  // TODO: here we could filter the account with "cachedTenantId" from the local storage instead of taking the active/first one?
  const msalAccount = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()?.[0];

  if (!msalAccount) {
    // If no account was found, we need to sign in.
    // This will eventually throw InteractionRequiredAuthError if silent is true, we won't handle it here.
    const loginRequest = {
      prompt: silent ? "none" : "login",
      scopes: [hrefEndpoint],
    };
    try {
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      return loginResponse.accessToken;
    } catch (error) {
      traceFailure(Action.SignInAad, {
        request: JSON.stringify(loginRequest),
        acquireTokenType: silent ? "silent" : "interactive",
        errorMessage: JSON.stringify(error),
      });
      throw error;
    }
  } else {
    msalInstance.setActiveAccount(msalAccount);
  }

  const tokenRequest = {
    account: msalAccount || null,
    forceRefresh: true,
    scopes: [hrefEndpoint],
    authority: `${configContext.AAD_ENDPOINT}${msalAccount.tenantId}`,
  };
  return acquireTokenWithMsal(msalInstance, tokenRequest, silent);
}

export async function acquireTokenWithMsal(
  msalInstance: msal.IPublicClientApplication,
  request: msal.SilentRequest,
  silent: boolean = false,
) {
  const tokenRequest = {
    account: msalInstance.getActiveAccount() || null,
    ...request,
  };

  try {
    // attempt silent acquisition first
    return (await msalInstance.acquireTokenSilent(tokenRequest)).accessToken;
  } catch (silentError) {
    if (silentError instanceof msal.InteractionRequiredAuthError && silent === false) {
      try {
        // The error indicates that we need to acquire the token interactively.
        // This will display a pop-up to re-establish authorization. If user does not
        // have pop-ups enabled in their browser, this will fail.
        return (await msalInstance.acquireTokenPopup(tokenRequest)).accessToken;
      } catch (interactiveError) {
        traceFailure(Action.SignInAad, {
          request: JSON.stringify(tokenRequest),
          acquireTokenType: "interactive",
          errorMessage: JSON.stringify(interactiveError),
        });

        throw interactiveError;
      }
    } else {
      traceFailure(Action.SignInAad, {
        request: JSON.stringify(tokenRequest),
        acquireTokenType: "silent",
        errorMessage: JSON.stringify(silentError),
      });

      throw silentError;
    }
  }
}
