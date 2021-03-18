import { RefreshResult } from "../SelfServeTypes";
import { userContext } from "../../UserContext";
import { armRequestWithoutPolling } from "../../Utils/arm/request";
import { configContext } from "../../ConfigContext";
import { SqlxServiceResource, UpdateDedicatedGatewayRequestParameters } from "./SqlxTypes";

const apiVersion = "2020-06-01-preview";

export enum ResourceStatus {
  Running = "Running",
  Creating = "Creating",
  Updating = "Updating",
  Deleting = "Deleting",
}

export interface DedicatedGatewayResponse {
  sku: string;
  instances: number;
  status: string;
  endpoint: string;
}

export const getPath = (subscriptionId: string, resourceGroup: string, name: string): string => {
  return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}/services/sqlx`;
};

export const updateDedicatedGatewayResource = async (sku: string, instances: number): Promise<string> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const body: UpdateDedicatedGatewayRequestParameters = {
    properties: {
      instanceSize: sku,
      instanceCount: instances,
      serviceType: "Sqlx",
    },
  };
  const armRequestResult = await armRequestWithoutPolling({
    host: configContext.ARM_ENDPOINT,
    path,
    method: "PUT",
    apiVersion,
    body,
  });
  return armRequestResult.operationStatusUrl;
};

export const deleteDedicatedGatewayResource = async (): Promise<string> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const armRequestResult = await armRequestWithoutPolling({
    host: configContext.ARM_ENDPOINT,
    path,
    method: "DELETE",
    apiVersion,
  });
  return armRequestResult.operationStatusUrl;
};

export const getDedicatedGatewayResource = async (): Promise<SqlxServiceResource> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const armRequestResult = await armRequestWithoutPolling<SqlxServiceResource>({
    host: configContext.ARM_ENDPOINT,
    path,
    method: "GET",
    apiVersion,
  });
  return armRequestResult.result;
};

export const getCurrentProvisioningState = async (): Promise<DedicatedGatewayResponse> => {
  try {
    const response = await getDedicatedGatewayResource();
    return {
      sku: response.properties.instanceSize,
      instances: response.properties.instanceCount,
      status: response.properties.status,
      endpoint: response.properties.sqlxEndPoint,
    };
  } catch (e) {
    return { sku: undefined, instances: undefined, status: undefined, endpoint: undefined };
  }
};

export const refreshDedicatedGatewayProvisioning = async (): Promise<RefreshResult> => {
  try {
    const response = await getDedicatedGatewayResource();
    if (response.properties.status === ResourceStatus.Running.toString()) {
      return { isUpdateInProgress: false, updateInProgressMessageTKey: undefined };
    } else if (response.properties.status === ResourceStatus.Creating.toString()) {
      return { isUpdateInProgress: true, updateInProgressMessageTKey: "CreateMessage" };
    } else if (response.properties.status === ResourceStatus.Deleting.toString()) {
      return { isUpdateInProgress: true, updateInProgressMessageTKey: "DeleteMessage" };
    } else {
      return { isUpdateInProgress: true, updateInProgressMessageTKey: "UpdateMessage" };
    }
  } catch {
    //TODO differentiate between different failures
    return { isUpdateInProgress: false, updateInProgressMessageTKey: undefined };
  }
};
