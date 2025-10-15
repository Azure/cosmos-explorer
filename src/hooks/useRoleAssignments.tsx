import useSWR from "swr";
import { configContext } from "../ConfigContext";

const apiVersion = "2025-04-15";

export type FetchAccountDetailsParams = {
    armToken: string;
    subscriptionId: string;
    resourceGroupName: string;
    accountName: string;
};

export type RoleAssignmentPropertiesType = {
    roleDefinitionId: string;
    principalId: string;
    scope: string;
};

export type RoleAssignmentType = {
    id: string;
    name: string;
    properties: RoleAssignmentPropertiesType;
    type: string;
};

const buildRoleAssignmentsListUrl = (params: FetchAccountDetailsParams): string => {
    const { subscriptionId, resourceGroupName, accountName } = params;

    let armEndpoint = configContext.ARM_ENDPOINT;
    if (armEndpoint.endsWith("/")) {
        armEndpoint = armEndpoint.slice(0, -1);
    }
    return `${armEndpoint}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlRoleAssignments?api-version=${apiVersion}`;
}

const fetchRoleAssignments = async (
    armToken: string,
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    principalId: string
): Promise<RoleAssignmentType[]> => {
    const uri = buildRoleAssignmentsListUrl({
        armToken,
        subscriptionId,
        resourceGroupName,
        accountName
    });
    const headers = new Headers();
    const bearer = `Bearer ${armToken}`;
    headers.append("Authorization", bearer);
    headers.append("Content-Type", "application/json");

    const response = await fetch(uri, {
        method: "GET",
        headers: headers
    });

    if (!response.ok) {
        throw new Error("Failed to fetch containers");
    }

    const data = await response.json();
    const assignments = data.value;
    const rolesAssignedToLoggedinUser = assignments.filter((assignment: RoleAssignmentType) => assignment?.properties?.principalId === principalId);
    return rolesAssignedToLoggedinUser;
};

export function useRoleAssignments(
    armToken: string,
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    principalId: string
): RoleAssignmentType[] | undefined {
    const { data } = useSWR(
        () => (
            armToken && subscriptionId && resourceGroupName && accountName && principalId ? [
                "fetchRoleAssignmentsLinkedToAccount",
                armToken, subscriptionId, resourceGroupName, accountName, principalId
            ] : undefined
        ),
        (_, armToken, subscriptionId, resourceGroupName, accountName, principalId) => fetchRoleAssignments(
            armToken,
            subscriptionId,
            resourceGroupName,
            accountName,
            principalId
        ),
    );

    return data;
}