import { SessionStorageUtility } from "../../Shared/StorageUtility";

export enum Sku {
    D4 = "D4",
    D8 = "D8",
    D16 = "D16",
    D32 = "D32",
    D64 = "D64"
}

export interface DedicatedGatewayResponse {
    sku: Sku,
    instances: number
}

export const getRegionSpecificSku = async () : Promise<Sku[]> => {
    return [Sku.D4, Sku.D16, Sku.D64]
}

export const updateDedicatedGatewayProvisioning = async (sku: Sku, instances: number) : Promise<void> => {
    SessionStorageUtility.setEntry("sku", sku);
    SessionStorageUtility.setEntry("instances", instances?.toString());
}

export const initializeDedicatedGatewayProvisioning = async () : Promise<DedicatedGatewayResponse> => {
    const skuString = SessionStorageUtility.getEntry("sku");
    const instances = parseInt(SessionStorageUtility.getEntry("instances"));
    return {
        sku: Sku[skuString as keyof typeof Sku], 
        instances: isNaN(instances) ? undefined : instances
    }
}
