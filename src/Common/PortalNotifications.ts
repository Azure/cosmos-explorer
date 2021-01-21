import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { userContext } from "../UserContext";
import { configContext, Platform } from "../ConfigContext";

const notificationsPath = () => {
  switch (configContext.platform) {
    case Platform.Hosted:
      return "/api/guest/notifications";
    case Platform.Portal:
      return "/api/notifications";
    default:
      throw new Error(`Unknown platform: ${configContext.platform}`);
  }
};

export const fetchPortalNotifications = async (): Promise<DataModels.Notification[]> => {
  if (configContext.platform === Platform.Emulator || configContext.platform === Platform.Hosted) {
    return [];
  }

  const databaseAccount = userContext.databaseAccount;
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const url = `${configContext.BACKEND_ENDPOINT}${notificationsPath()}?accountName=${
    databaseAccount.name
  }&subscriptionId=${subscriptionId}&resourceGroup=${resourceGroup}`;
  const authorizationHeader: ViewModels.AuthorizationTokenHeaderMetadata = getAuthorizationHeader();
  const headers = { [authorizationHeader.header]: authorizationHeader.token };

  const response = await window.fetch(url, {
    headers
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as DataModels.Notification[];
};
