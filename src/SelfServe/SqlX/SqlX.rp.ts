import { RefreshResult } from "../SelfServeTypes";

export interface DedicatedGatewayResponse {
  sku: string;
  instances: number;
}

export const getRegionSpecificMinInstances = async (): Promise<number> => {
  // TODO: write RP call to get min number of instances needed for this region
  throw new Error("getRegionSpecificMinInstances not implemented");
};

export const getRegionSpecificMaxInstances = async (): Promise<number> => {
  // TODO: write RP call to get max number of instances needed for this region
  throw new Error("getRegionSpecificMaxInstances not implemented");
};

export const updateDedicatedGatewayProvisioning = async (sku: string, instances: number): Promise<void> => {
  // TODO: write RP call to update dedicated gateway provisioning
  throw new Error(
    `updateDedicatedGatewayProvisioning not implemented. Parameters- sku: ${sku}, instances:${instances}`
  );
};

export const initializeDedicatedGatewayProvisioning = async (): Promise<DedicatedGatewayResponse> => {
  // TODO: write RP call to initialize UI for dedicated gateway provisioning
  throw new Error("initializeDedicatedGatewayProvisioning not implemented");
};

export const refreshDedicatedGatewayProvisioning = async (): Promise<RefreshResult> => {
  // TODO: write RP call to check if dedicated gateway update has gone through
  throw new Error("refreshDedicatedGatewayProvisioning not implemented");
};
