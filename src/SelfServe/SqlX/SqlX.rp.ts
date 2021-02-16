import { RefreshResult } from "../SelfServeTypes";
import { userContext } from "../../UserContext";
import { armRequest } from "../../Utils/arm/request";
import { configContext } from "../../ConfigContext";
import {
  SqlxServiceResource,
  UpdateDedicatedGatewayRequestParameters
} from "./SqlxTypes"

const apiVersion = "2020-06-01-preview";

export enum ResourceStatus {
  Running,
  Creating,
  Updating,
  Deleting
}

export interface DedicatedGatewayResponse {
  sku: string;
  instances: number;
  status: string;
  endpoint: string;
}

export const getPath = (subscriptionId: string, resourceGroup: string, name: string): string => {
  return `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}/services/sqlx`;
}

export const updateDedicatedGatewayResource = async (sku: string, instances: number): Promise<void> => {
  // TODO: write RP call to update dedicated gateway provisioning
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  const body: UpdateDedicatedGatewayRequestParameters = {
    properties: {
      instanceSize: sku,
      instanceCount: instances,
      serviceType: "Sqlx"
    }
  };
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
};

export const deleteDedicatedGatewayResource = async (): Promise<void> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "DELETE", apiVersion });
}

export const getDedicatedGatewayResource = async() : Promise<SqlxServiceResource> => {
  const path = getPath(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name);
  return armRequest<SqlxServiceResource>({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

export const getCurrentProvisioningState = async (): Promise<DedicatedGatewayResponse> => {
  try
  {
    const response =  await getDedicatedGatewayResource();
    return { sku: response.properties.instanceSize, instances: response.properties.instanceCount, status: response.properties.status, endpoint: response.properties.sqlxEndPoint}
  }
  catch (e)
  {
    return {sku: undefined, instances: undefined, status: undefined, endpoint: undefined};
  }
};

export const refreshDedicatedGatewayProvisioning = async (): Promise<RefreshResult> => {
  // TODO: write RP call to check if dedicated gateway update has gone through
  try
  {
    const response = await getDedicatedGatewayResource();
    if (response.properties.status === ResourceStatus.Running.toString())
    {
      return {isUpdateInProgress: false, notificationMessage: undefined}
    }
    else if (response.properties.status === ResourceStatus.Creating.toString())
    {
      return {isUpdateInProgress: true, notificationMessage: "CreateMessage"};
    }
    else if (response.properties.status === ResourceStatus.Deleting.toString())
    {
      return {isUpdateInProgress: true, notificationMessage: "DeleteMessage"};
    }
    else
    {
      return {isUpdateInProgress: true, notificationMessage: "UpdateMessage"};
    }
  }
  catch
  {
    return {isUpdateInProgress: false, notificationMessage: undefined}
  }
};
