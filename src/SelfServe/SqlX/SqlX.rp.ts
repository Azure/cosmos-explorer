import { RefreshResult } from "../SelfServeTypes";
import { userContext } from "../../UserContext";
import { armRequest } from "../../Utils/arm/request";
import { configContext } from "../../ConfigContext";
import {
  SqlxServiceResource,
  UpdateDedicatedGatewayRequestParameters
} from "./SqlxTypes"

const apiVersion = "2020-06-01-preview";

export interface DedicatedGatewayResponse {
  sku: string;
  instances: number;
  status: string;
  endpoint: string;
}

export enum SKU {
  CosmosD4s = "Cosmos.D4s",
  CosmosD8s = "Cosmos.D8s",
  CosmosD16s = "Cosmos.D16s",
  CosmosD32s = "Cosmos.D32s"
}

export const updateDedicatedGatewayResource = async (sku: string, instances: number): Promise<void> => {
  // TODO: write RP call to update dedicated gateway provisioning
  const path = `/subscriptions/${userContext.subscriptionId}/resourceGroups/${userContext.resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${userContext.databaseAccount.name}/services/sqlx`;
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
  const path = `/subscriptions/${userContext.subscriptionId}/resourceGroups/${userContext.resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${userContext.databaseAccount.name}/services/sqlx`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "DELETE", apiVersion });
}

export const getDedicatedGatewayResource = async() : Promise<SqlxServiceResource> => {
  const path = `/subscriptions/${userContext.subscriptionId}/resourceGroups/${userContext.resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${userContext.databaseAccount.name}/services/sqlx`;
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
    return {sku: null, instances: null, status: null, endpoint: null};
  }
};

export const refreshDedicatedGatewayProvisioning = async (): Promise<RefreshResult> => {
  // TODO: write RP call to check if dedicated gateway update has gone through
  try
  {
    const response = await getDedicatedGatewayResource();
    if (response.properties.status == "Running")
    {
      return {isUpdateInProgress: false}
    }
    else if (response.properties.status == "Creating")
    {
      return {isUpdateInProgress: true, notificationMessage: "CreateMessage"};
    }
    else if (response.properties.status == "Deleting")
    {
      console.log(response.properties.status);
      return {isUpdateInProgress: true, notificationMessage: "DeleteMessage"};
    }
    else
    {
      console.log(response.properties.status);
      return {isUpdateInProgress: true, notificationMessage: "UpdateMessage"};
    }
  }
  catch
  {
    return {isUpdateInProgress: false}
  }
};
