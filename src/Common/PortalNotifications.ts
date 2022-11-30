import { configContext, Platform } from "../ConfigContext";
import * as DataModels from "../Contracts/DataModels";
import { userContext } from "../UserContext";
import { getAuthorizationHeaders } from "../Utils/AuthorizationUtils";

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

  const { databaseAccount, resourceGroup, subscriptionId } = userContext;
  const url = `${configContext.BACKEND_ENDPOINT}${notificationsPath()}?accountName=${
    databaseAccount.name
  }&subscriptionId=${subscriptionId}&resourceGroup=${resourceGroup}`;
  const headers: Headers = getAuthorizationHeaders();

  const response = await window.fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as DataModels.Notification[];
};
