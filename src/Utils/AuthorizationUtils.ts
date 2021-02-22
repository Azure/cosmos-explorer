import { AuthType } from "../AuthType";
import * as Constants from "../Common/Constants";
import * as Logger from "../Common/Logger";
import { configContext, Platform } from "../ConfigContext";
import * as ViewModels from "../Contracts/ViewModels";
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
      .join("")
  );

  return JSON.parse(tokenPayload);
}

export function displayTokenRenewalPromptForStatus(httpStatusCode: number): void {
  const explorer = window.dataExplorer;

  if (
    httpStatusCode == null ||
    httpStatusCode != Constants.HttpStatusCodes.Unauthorized ||
    configContext.platform !== Platform.Hosted
  ) {
    return;
  }

  explorer.displayGuestAccessTokenRenewalPrompt();
}
