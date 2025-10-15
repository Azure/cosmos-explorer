import { useRoleAssignments } from "hooks/useRoleAssignments";
import { RoleDefinitionType, useRoleDefinitions } from "hooks/useRoleDefinition";
import { useMemo } from "react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import {
    BackupPolicyType,
    CopyJobMigrationType,
    DefaultIdentityType,
    IdentityType
} from "../../../../Enums";
import { CopyJobContextState } from "../../../../Types";
import AddManagedIdentity from "../AddManagedIdentity";
import AddReadPermissionToDefaultIdentity from "../AddReadPermissionToDefaultIdentity";
import DefaultManagedIdentity from "../DefaultManagedIdentity";
import OnlineCopyEnabled from "../OnlineCopyEnabled";
import PointInTimeRestore from "../PointInTimeRestore";

export interface PermissionSectionConfig {
    id: string;
    title: string;
    Component: React.FC;
    disabled?: boolean;
    completed?: boolean;
}

// Section IDs for maintainability
const SECTION_IDS = {
    addManagedIdentity: "addManagedIdentity",
    defaultManagedIdentity: "defaultManagedIdentity",
    readPermissionAssigned: "readPermissionAssigned",
    pointInTimeRestore: "pointInTimeRestore",
    onlineCopyEnabled: "onlineCopyEnabled"
} as const;

const PERMISSION_SECTIONS_CONFIG: PermissionSectionConfig[] = [
    {
        id: SECTION_IDS.addManagedIdentity,
        title: ContainerCopyMessages.addManagedIdentity.title,
        Component: AddManagedIdentity,
    },
    {
        id: SECTION_IDS.defaultManagedIdentity,
        title: ContainerCopyMessages.defaultManagedIdentity.title,
        Component: DefaultManagedIdentity,
    },
    {
        id: SECTION_IDS.readPermissionAssigned,
        title: ContainerCopyMessages.readPermissionAssigned.title,
        Component: AddReadPermissionToDefaultIdentity,
    }
];

const PERMISSION_SECTIONS_FOR_ONLINE_JOBS: PermissionSectionConfig[] = [
    {
        id: SECTION_IDS.pointInTimeRestore,
        title: ContainerCopyMessages.pointInTimeRestore.title,
        Component: PointInTimeRestore,
    },
    {
        id: SECTION_IDS.onlineCopyEnabled,
        title: ContainerCopyMessages.onlineCopyEnabled.title,
        Component: OnlineCopyEnabled,
    }
];


/**
 * Checks if the user has the Reader role based on role definitions.
 */
export function checkUserHasReaderRole(roleDefinitions: RoleDefinitionType[]): boolean {
    return roleDefinitions?.some(
        role =>
            role.name === "00000000-0000-0000-0000-000000000001" ||
            role.permissions.some(
                permission =>
                    permission.dataActions.includes("Microsoft.DocumentDB/databaseAccounts/readMetadata") &&
                    permission.dataActions.includes("Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/read")
            )
    );
}

/**
 * Returns the permission sections configuration for the Assign Permissions screen.
 * Memoizes derived values for performance and decouples logic for testability.
 */
const usePermissionSections = (
    state: CopyJobContextState,
    armToken: string,
    principalId: string
): PermissionSectionConfig[] => {
    const { source, target } = state;

    // Memoize identity types and backup policy
    const targetAccountIdentityType = useMemo(
        () => (target?.account?.identity?.type ?? "").toLowerCase(),
        [target?.account?.identity?.type]
    );
    const targetAccountDefaultIdentityType = useMemo(
        () => (target?.account?.properties?.defaultIdentity ?? "").toLowerCase(),
        [target?.account?.properties?.defaultIdentity]
    );
    const sourceAccountBackupPolicy = useMemo(
        () => source?.account?.properties?.backupPolicy?.type ?? "",
        [source?.account?.properties?.backupPolicy?.type]
    );

    // Fetch role assignments and definitions
    const roleAssigned = useRoleAssignments(
        armToken,
        source?.subscription?.subscriptionId,
        source?.account?.resourceGroup,
        source?.account?.name,
        principalId
    );

    const roleDefinitions = useRoleDefinitions(
        armToken,
        roleAssigned ?? []
    );

    const hasReaderRole = useMemo(
        () => checkUserHasReaderRole(roleDefinitions ?? []),
        [roleDefinitions]
    );

    // Decouple section state logic for testability
    const getBaseSections = useMemo(() => {
        return PERMISSION_SECTIONS_CONFIG.map(section => {
            if (
                section.id === SECTION_IDS.addManagedIdentity &&
                (targetAccountIdentityType === IdentityType.SystemAssigned ||
                    targetAccountIdentityType === IdentityType.UserAssigned)
            ) {
                return {
                    ...section,
                    disabled: true,
                    completed: true
                };
            }
            if (
                section.id === SECTION_IDS.defaultManagedIdentity &&
                targetAccountDefaultIdentityType === DefaultIdentityType.SystemAssignedIdentity
            ) {
                return {
                    ...section,
                    disabled: true,
                    completed: true
                };
            }
            if (
                section.id === SECTION_IDS.readPermissionAssigned &&
                hasReaderRole
            ) {
                return {
                    ...section,
                    disabled: true,
                    completed: true
                };
            }
            return section;
        });
    }, [targetAccountIdentityType, targetAccountDefaultIdentityType, hasReaderRole]);

    const getOnlineSections = useMemo(() => {
        if (state.migrationType !== CopyJobMigrationType.Online) return [];
        return PERMISSION_SECTIONS_FOR_ONLINE_JOBS.map(section => {
            if (
                section.id === SECTION_IDS.pointInTimeRestore &&
                sourceAccountBackupPolicy === BackupPolicyType.Continuous
            ) {
                return {
                    ...section,
                    disabled: true,
                    completed: true
                };
            }
            return section;
        });
    }, [state.migrationType, sourceAccountBackupPolicy]);

    // Combine and memoize final sections
    const permissionSections = useMemo(
        () => [...getBaseSections, ...getOnlineSections],
        [getBaseSections, getOnlineSections]
    );

    return permissionSections;
};

export default usePermissionSections;