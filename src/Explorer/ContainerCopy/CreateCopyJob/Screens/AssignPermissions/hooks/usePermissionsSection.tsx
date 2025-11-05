import { useEffect, useMemo, useRef, useState } from "react";
import { CapabilityNames } from "../../../../../../Common/Constants";
import { fetchRoleAssignments, fetchRoleDefinitions, RoleDefinitionType } from "../../../../../../Utils/arm/RbacUtils";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { getAccountDetailsFromResourceId } from "../../../../CopyJobUtils";
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
 * Returns the permission sections configuration for the Assign Permissions screen.
 * Memoizes derived values for performance and decouples logic for testability.
 */
const usePermissionSections = (state: CopyJobContextState): PermissionSectionConfig[] => {
  const sourceAccountId = state?.source?.account?.id || "";
  const targetAccountId = state?.target?.account?.id || "";

  const { validationCache, setValidationCache } = useCopyJobPrerequisitesCache();
  const [permissionSections, setPermissionSections] = useState<PermissionSectionConfig[] | null>(null);
  const isValidatingRef = useRef(false);

  const sectionToValidate = useMemo(() => {
    const baseSections = sourceAccountId === targetAccountId ? [] : [...PERMISSION_SECTIONS_CONFIG];
    if (state.migrationType === CopyJobMigrationType.Online) {
      return [...baseSections, ...PERMISSION_SECTIONS_FOR_ONLINE_JOBS];
    }
    return baseSections;
  }, [sourceAccountId, targetAccountId, state.migrationType]);

  const memoizedValidationCache = useMemo(() => {
    if (state.migrationType === CopyJobMigrationType.Offline) {
      validationCache.delete(SECTION_IDS.pointInTimeRestore);
      validationCache.delete(SECTION_IDS.onlineCopyEnabled);
    }
    return validationCache;
  }, [state.migrationType]);

  useEffect(() => {
    const validateSections = async () => {
      if (isValidatingRef.current) {
        return;
      }

      isValidatingRef.current = true;
      const result: PermissionSectionConfig[] = [];
      const newValidationCache = new Map(memoizedValidationCache);

      for (let i = 0; i < sectionToValidate.length; i++) {
        const section = sectionToValidate[i];

        if (newValidationCache.has(section.id) && newValidationCache.get(section.id) === true) {
          result.push({ ...section, completed: true });
          continue;
        }
        if (section.validate) {
          const isValid = await section.validate(state);
          newValidationCache.set(section.id, isValid);
          result.push({ ...section, completed: isValid });

          if (!isValid) {
            for (let j = i + 1; j < sectionToValidate.length; j++) {
              result.push({ ...sectionToValidate[j], completed: false });
            }
            break;
          }
        } else {
          newValidationCache.set(section.id, false);
          result.push({ ...section, completed: false });
        }
      }

      setValidationCache(newValidationCache);
      setPermissionSections(result);
      isValidatingRef.current = false;
    };

    validateSections();

    return () => {
      isValidatingRef.current = false;
    };
  }, [state, sectionToValidate]);

  return permissionSections ?? [];
};

export default usePermissionSections;
