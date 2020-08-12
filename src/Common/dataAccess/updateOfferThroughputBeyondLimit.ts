import { Platform, configContext } from "../../ConfigContext";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import { AutoPilotOfferSettings } from "../../Contracts/DataModels";
import { logConsoleProgress, logConsoleInfo, logConsoleError } from "../../Utils/NotificationConsoleUtils";
import { HttpHeaders } from "../Constants";

interface UpdateOfferThroughputRequest {
  subscriptionId: string;
  resourceGroup: string;
  databaseAccountName: string;
  databaseName: string;
  collectionName?: string;
  throughput: number;
  offerIsRUPerMinuteThroughputEnabled: boolean;
  offerAutopilotSettings?: AutoPilotOfferSettings;
}

export async function updateOfferThroughputBeyondLimit(request: UpdateOfferThroughputRequest): Promise<void> {
  if (configContext.platform !== Platform.Portal) {
    throw new Error("Updating throughput beyond specified limit is not supported on this platform");
  }

  const resourceDescriptionInfo = request.collectionName
    ? `database ${request.databaseName} and container ${request.collectionName}`
    : `database ${request.databaseName}`;

  const clearMessage = logConsoleProgress(
    `Requesting increase in throughput to ${request.throughput} for ${resourceDescriptionInfo}`
  );

  const explorer = window.dataExplorer;
  const url = `${explorer.extensionEndpoint()}/api/offerthroughputrequest/updatebeyondspecifiedlimit`;
  const authorizationHeader = getAuthorizationHeader();

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(request),
    headers: { [authorizationHeader.header]: authorizationHeader.token, [HttpHeaders.contentType]: "application/json" }
  });

  if (response.ok) {
    logConsoleInfo(
      `Successfully requested an increase in throughput to ${request.throughput} for ${resourceDescriptionInfo}`
    );
    clearMessage();
    return undefined;
  }
  const error = await response.json();
  logConsoleError(`Failed to request an increase in throughput for ${request.throughput}: ${error.message}`);
  clearMessage();
  throw new Error(error.message);
}
