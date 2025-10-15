import useSWR from "swr";
import { configContext } from "../ConfigContext";
import { RoleAssignmentType } from "./useRoleAssignments";

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
const buildRoleDefinitionUrl = (roleDefinitionId: string): string => {
    let armEndpoint = configContext.ARM_ENDPOINT;
    if (armEndpoint.endsWith("/")) {
        armEndpoint = armEndpoint.slice(0, -1);
    }
    return `${armEndpoint}${roleDefinitionId}?api-version=${apiVersion}`;
}

const fetchRoleDefinitions = async (
    armToken: string,
    roleAssignments: RoleAssignmentType[],
): Promise<RoleDefinitionType[]> => {
    const roleDefinitionIds = roleAssignments.map(assignment => assignment.properties.roleDefinitionId);
    const uniqueRoleDefinitionIds = Array.from(new Set(roleDefinitionIds));

    const roleDefinitionUris = uniqueRoleDefinitionIds.map(roleDefinitionId => buildRoleDefinitionUrl(roleDefinitionId));
    const headers = {
        Authorization: `Bearer ${armToken}`,
        "Content-Type": "application/json"
    };
    const promises = roleDefinitionUris.map(uri => fetch(uri, { method: "GET", headers }));
    const responses = await Promise.all(promises);
    for (const response of responses) {
        if (!response.ok) throw new Error("Failed to fetch role definitions");
    }
    const roleDefinitions = await Promise.all(responses.map(r => r.json()));
    return roleDefinitions;
};

export function useRoleDefinitions(
    armToken: string,
    roleAssignments: RoleAssignmentType[],
): RoleDefinitionType[] | undefined {
    const { data } = useSWR(
        () => (
            armToken && roleAssignments?.length ? [
                "fetchRoleDefinitionsForTheAssignments",
                armToken, roleAssignments
            ] : undefined
        ),
        (_, armToken, roleAssignments) => fetchRoleDefinitions(
            armToken,
            roleAssignments
        ),
    );

    return data;
}