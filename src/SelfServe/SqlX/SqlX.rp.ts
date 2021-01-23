import { RefreshResult } from "../SelfServeComponent";

export enum Sku {
  D4 = "D4",
  D8 = "D8",
  D16 = "D16",
  D32 = "D32",
  D64 = "D64",
}

export interface DedicatedGatewayResponse {
  sku: Sku;
  instances: number;
}

export const getRegionSpecificSku = async (): Promise<Sku[]> => {
  // TODO: write RP call to get SKUs available for this region
  throw new Error("getRegionSpecificSku not implemented");
};

export const updateDedicatedGatewayProvisioning = async (sku: Sku, instances: number): Promise<void> => {
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
