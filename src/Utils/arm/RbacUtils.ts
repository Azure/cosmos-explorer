import { configContext } from "ConfigContext";
import { armRequest } from "Utils/arm/request";
import { getCopyJobAuthorizationHeader } from "../CopyJobAuthUtils";

export type FetchAccountDetailsParams = {
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

type RoleDefinitionDataActions = {
    dataActions: string[];
};

export type RoleDefinitionType = {
    assignableScopes: string[];
    id: string;
    name: string;
    permissions: RoleDefinitionDataActions[];
    resourceGroup: string;
    roleName: string;
    type: string;
    typePropertiesType: string;
};

const apiVersion = "2025-04-15";

const getArmBaseUrl = (): string => {
    const base = configContext.ARM_ENDPOINT;
    return base.endsWith("/") ? base.slice(0, -1) : base;
};

const buildArmUrl = (path: string): string =>
    `${getArmBaseUrl()}${path}?api-version=${apiVersion}`;

const handleResponse = async (response: Response, context: string) => {
    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
            `Failed to fetch ${context}. Status: ${response.status}. ${body || ""}`
        );
    }
    return response.json();
};

export const fetchRoleAssignments = async (
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    principalId: string
): Promise<RoleAssignmentType[]> => {
    const uri = buildArmUrl(
        `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlRoleAssignments`
    );

    const response = await fetch(uri, { method: "GET", headers: getCopyJobAuthorizationHeader() });
    const data = await handleResponse(response, "role assignments");

    return (data.value || []).filter(
        (assignment: RoleAssignmentType) =>
            assignment?.properties?.principalId === principalId
    );
};

export const fetchRoleDefinitions = async (
    roleAssignments: RoleAssignmentType[]
): Promise<RoleDefinitionType[]> => {
    const roleDefinitionIds = roleAssignments.map(assignment => assignment.properties.roleDefinitionId);
    const uniqueRoleDefinitionIds = Array.from(new Set(roleDefinitionIds));

    const headers = getCopyJobAuthorizationHeader();
    const roleDefinitionUris = uniqueRoleDefinitionIds.map((id) => buildArmUrl(id));

    const promises = roleDefinitionUris.map((url) => fetch(url, { method: "GET", headers }));
    const responses = await Promise.all(promises);

    const roleDefinitions = await Promise.all(
        responses.map((res, i) => handleResponse(res, `role definition ${uniqueRoleDefinitionIds[i]}`))
    );

    return roleDefinitions;
};

export const assignRole = async (
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    principalId: string
): Promise<RoleAssignmentType> => {
    const accountScope = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`;
    const roleDefinitionId = `${accountScope}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000001`;
    const roleAssignmentName = crypto.randomUUID();
    const path = `${accountScope}/sqlRoleAssignments/${roleAssignmentName}`;

    const body = {
        properties: {
            roleDefinitionId,
            scope: `${accountScope}/`,
            principalId
        }
    };
    const response: RoleAssignmentType = await armRequest({
        host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body
    });
    return response;
};
