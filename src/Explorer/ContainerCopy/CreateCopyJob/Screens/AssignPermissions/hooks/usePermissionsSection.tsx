import { useEffect, useMemo, useRef, useState } from "react";
import { CapabilityNames } from "../../../../../../Common/Constants";
import { fetchRoleAssignments, fetchRoleDefinitions, RoleDefinitionType } from "../../../../../../Utils/arm/RbacUtils";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { getAccountDetailsFromResourceId, getContainerIdentifiers, isIntraAccountCopy } from "../../../../CopyJobUtils";
import {
  BackupPolicyType,
  CopyJobMigrationType,
  DefaultIdentityType,
  IdentityType,
} from "../../../../Enums/CopyJobEnums";
import { CopyJobContextState } from "../../../../Types/CopyJobTypes";
import { useCopyJobPrerequisitesCache } from "../../../Utils/useCopyJobPrerequisitesCache";
import AddManagedIdentity from "../AddManagedIdentity";
import AddReadPermissionToDefaultIdentity from "../AddReadPermissionToDefaultIdentity";
import DefaultManagedIdentity from "../DefaultManagedIdentity";
import OnlineCopyEnabled from "../OnlineCopyEnabled";
import PointInTimeRestore from "../PointInTimeRestore";

export interface PermissionSectionConfig {
  id: string;
  title: string;
  Component: React.ComponentType;
  disabled: boolean;
  completed?: boolean;
  validate?: (state: CopyJobContextState) => boolean | Promise<boolean>;
}

export interface PermissionGroupConfig {
  id: string;
  title: string;
  description: string;
  sections: PermissionSectionConfig[];
}

export const SECTION_IDS = {
  addManagedIdentity: "addManagedIdentity",
  defaultManagedIdentity: "defaultManagedIdentity",
  readPermissionAssigned: "readPermissionAssigned",
  pointInTimeRestore: "pointInTimeRestore",
  onlineCopyEnabled: "onlineCopyEnabled",
} as const;

const PERMISSION_SECTIONS_CONFIG: PermissionSectionConfig[] = [
  {
    id: SECTION_IDS.addManagedIdentity,
    title: ContainerCopyMessages.addManagedIdentity.title,
    Component: AddManagedIdentity,
    disabled: true,
    validate: (state: CopyJobContextState) => {
      const targetAccountIdentityType = (state?.target?.account?.identity?.type ?? "").toLowerCase();
      return (
        targetAccountIdentityType === IdentityType.SystemAssigned ||
        targetAccountIdentityType === IdentityType.UserAssigned
      );
    },
  },
  {
    id: SECTION_IDS.defaultManagedIdentity,
    title: ContainerCopyMessages.defaultManagedIdentity.title,
    Component: DefaultManagedIdentity,
    disabled: true,
    validate: (state: CopyJobContextState) => {
      const targetAccountDefaultIdentity = (state?.target?.account?.properties?.defaultIdentity ?? "").toLowerCase();
      return targetAccountDefaultIdentity === DefaultIdentityType.SystemAssignedIdentity;
    },
  },
  {
    id: SECTION_IDS.readPermissionAssigned,
    title: ContainerCopyMessages.readPermissionAssigned.title,
    Component: AddReadPermissionToDefaultIdentity,
    disabled: true,
    validate: async (state: CopyJobContextState) => {
      const principalId = state?.target?.account?.identity?.principalId;
      const selectedSourceAccount = state?.source?.account;
      const {
        subscriptionId: sourceSubscriptionId,
        resourceGroup: sourceResourceGroup,
        accountName: sourceAccountName,
      } = getAccountDetailsFromResourceId(selectedSourceAccount?.id);

      const rolesAssigned = await fetchRoleAssignments(
        sourceSubscriptionId,
        sourceResourceGroup,
        sourceAccountName,
        principalId,
      );

      const roleDefinitions = await fetchRoleDefinitions(rolesAssigned ?? []);
      return checkTargetHasReaderRoleOnSource(roleDefinitions ?? []);
    },
  },
];

const PERMISSION_SECTIONS_FOR_ONLINE_JOBS: PermissionSectionConfig[] = [
  {
    id: SECTION_IDS.pointInTimeRestore,
    title: ContainerCopyMessages.pointInTimeRestore.title,
    Component: PointInTimeRestore,
    disabled: true,
    validate: (state: CopyJobContextState) => {
      const sourceAccountBackupPolicy = state?.source?.account?.properties?.backupPolicy?.type ?? "";
      return sourceAccountBackupPolicy === BackupPolicyType.Continuous;
    },
  },
  {
    id: SECTION_IDS.onlineCopyEnabled,
    title: ContainerCopyMessages.onlineCopyEnabled.title,
    Component: OnlineCopyEnabled,
    disabled: true,
    validate: (state: CopyJobContextState) => {
      const accountCapabilities = state?.source?.account?.properties?.capabilities ?? [];
      const onlineCopyCapability = accountCapabilities.find(
        (capability) => capability.name === CapabilityNames.EnableOnlineCopyFeature,
      );
      return !!onlineCopyCapability;
    },
  },
];

/**
 * Checks if the user has the Reader role based on role definitions.
 */
export function checkTargetHasReaderRoleOnSource(roleDefinitions: RoleDefinitionType[]): boolean {
  return roleDefinitions?.some(
    (role) =>
      role.name === "00000000-0000-0000-0000-000000000001" ||
      role.permissions.some(
        (permission) =>
          permission.dataActions.includes("Microsoft.DocumentDB/databaseAccounts/readMetadata") &&
          permission.dataActions.includes("Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/read"),
      ),
  );
}

/**
 * Validates sections within a group sequentially.
 */
const validateSectionsInGroup = async (
  sections: PermissionSectionConfig[],
  state: CopyJobContextState,
  validationCache: Map<string, boolean>,
): Promise<PermissionSectionConfig[]> => {
  const result: PermissionSectionConfig[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    if (validationCache.has(section.id) && validationCache.get(section.id) === true) {
      result.push({ ...section, completed: true });
      continue;
    }

    if (section.validate) {
      const isValid = await section.validate(state);
      validationCache.set(section.id, isValid);
      result.push({ ...section, completed: isValid });

      if (!isValid) {
        // Mark remaining sections in this group as incomplete
        for (let j = i + 1; j < sections.length; j++) {
          result.push({ ...sections[j], completed: false });
        }
        break;
      }
    } else {
      validationCache.set(section.id, false);
      result.push({ ...section, completed: false });
    }
  }

  return result;
};

/**
 * Returns the permission groups configuration for the Assign Permissions screen.
 * Groups validate independently but sections within each group validate sequentially.
 */
const usePermissionSections = (state: CopyJobContextState): PermissionGroupConfig[] => {
  const sourceAccount = getContainerIdentifiers(state.source);
  const targetAccount = getContainerIdentifiers(state.target);

  const { validationCache, setValidationCache } = useCopyJobPrerequisitesCache();
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroupConfig[] | null>(null);
  const isValidatingRef = useRef(false);

  const groupsToValidate = useMemo(() => {
    const isSameAccount = isIntraAccountCopy(sourceAccount.accountId, targetAccount.accountId);
    const crossAccountSections = isSameAccount ? [] : [...PERMISSION_SECTIONS_CONFIG];
    const groups: PermissionGroupConfig[] = [];
    const sourceAccountName = state.source?.account?.name || "";
    const targetAccountName = state.target?.account?.name || "";

    if (crossAccountSections.length > 0) {
      groups.push({
        id: "crossAccountConfigs",
        title: ContainerCopyMessages.assignPermissions.crossAccountConfiguration.title,
        description: ContainerCopyMessages.assignPermissions.crossAccountConfiguration.description(
          sourceAccountName,
          targetAccountName,
        ),
        sections: crossAccountSections,
      });
    }

    if (state.migrationType === CopyJobMigrationType.Online) {
      groups.push({
        id: "onlineConfigs",
        title: ContainerCopyMessages.assignPermissions.onlineConfiguration.title,
        description: ContainerCopyMessages.assignPermissions.onlineConfiguration.description(sourceAccountName),
        sections: [...PERMISSION_SECTIONS_FOR_ONLINE_JOBS],
      });
    }

    return groups;
  }, [sourceAccount.accountId, targetAccount.accountId, state.migrationType]);

  const memoizedValidationCache = useMemo(() => {
    if (state.migrationType === CopyJobMigrationType.Offline) {
      validationCache.delete(SECTION_IDS.pointInTimeRestore);
      validationCache.delete(SECTION_IDS.onlineCopyEnabled);
    }
    return validationCache;
  }, [state.migrationType]);

  useEffect(() => {
    const validateGroups = async () => {
      if (isValidatingRef.current) {
        return;
      }

      isValidatingRef.current = true;
      const newValidationCache = new Map(memoizedValidationCache);

      // Validate all groups independently (in parallel)
      const validatedGroups = await Promise.all(
        groupsToValidate.map(async (group) => {
          const validatedSections = await validateSectionsInGroup(group.sections, state, newValidationCache);

          return {
            ...group,
            sections: validatedSections,
          };
        }),
      );

      setValidationCache(newValidationCache);
      setPermissionGroups(validatedGroups);
      isValidatingRef.current = false;
    };

    validateGroups();

    return () => {
      isValidatingRef.current = false;
    };
  }, [state, groupsToValidate]);

  return permissionGroups ?? [];
};

export default usePermissionSections;
