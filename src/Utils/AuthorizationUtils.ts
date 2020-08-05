import * as Constants from "../Common/Constants";
import * as ViewModels from "../Contracts/ViewModels";
import AuthHeadersUtil from "../Platform/Hosted/Authorization";
import { AuthType } from "../AuthType";
import * as Logger from "../Common/Logger";
import { PlatformType } from "../PlatformType";
import { configContext } from "../ConfigContext";
import { userContext } from "../UserContext";

export function getAuthorizationHeader(): ViewModels.AuthorizationTokenHeaderMetadata {
  if (window.authType === AuthType.EncryptedToken) {
    return {
      header: Constants.HttpHeaders.guestAccessToken,
      token: userContext.accessToken
    };
  } else {
    return {
      header: Constants.HttpHeaders.authorization,
      token: userContext.authorizationToken || ""
    };
  }
}

export async function getArcadiaAuthToken(
  arcadiaEndpoint: string = configContext.ARCADIA_ENDPOINT,
  tenantId?: string
): Promise<string> {
  try {
    const token = await AuthHeadersUtil.getAccessToken(arcadiaEndpoint, tenantId);
    return token;
  } catch (error) {
    Logger.logError(error, "AuthorizationUtils/getArcadiaAuthToken");
    throw error;
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
      .map(p => "%" + ("00" + p.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return JSON.parse(tokenPayload);
}

export function displayTokenRenewalPromptForStatus(httpStatusCode: number): void {
  const platformType = window.dataExplorerPlatform;
  const explorer = window.dataExplorer;

  if (
    httpStatusCode == null ||
    httpStatusCode != Constants.HttpStatusCodes.Unauthorized ||
    platformType !== PlatformType.Hosted
  ) {
    return;
  }

  explorer.displayGuestAccessTokenRenewalPrompt();
}
