import { DatabaseAccount } from "Contracts/DataModels";
import { configContext } from "../../ConfigContext";
import { fetchDatabaseAccount } from "./databaseAccountUtils";
import { armRequest } from "./request";

const apiVersion = "2025-04-15";

const updateIdentity = async (
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    body: object
): Promise<DatabaseAccount> => {
    const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`;
    const response: { status: string } = await armRequest({
        host: configContext.ARM_ENDPOINT, path, method: "PATCH", apiVersion, body
    });
    if (response.status === "Succeeded") {
        const account = await fetchDatabaseAccount(subscriptionId, resourceGroupName, accountName);
        return account;
    }
    return null;
};

const updateSystemIdentity = async (
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
): Promise<DatabaseAccount> => {
    const body = {
        identity: {
            type: "SystemAssigned"
        }
    };
    const updatedAccount = await updateIdentity(subscriptionId, resourceGroupName, accountName, body);
    return updatedAccount;
};

const updateDefaultIdentity = async (
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
): Promise<DatabaseAccount> => {
    const body = {
        properties: {
            defaultIdentity: "SystemAssignedIdentity"
        }
    };
    const updatedAccount = await updateIdentity(subscriptionId, resourceGroupName, accountName, body);
    return updatedAccount;
};



export { updateDefaultIdentity, updateSystemIdentity };

