import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { CopyJobMigrationType } from "../../../../Enums";
import { CopyJobContextState } from "../../../../Types";
import AddManagedIdentity from "../AddManagedIdentity";
import AddReadPermissionToDefaultIdentity from "../AddReadPermissionToDefaultIdentity";
import DefaultManagedIdentity from "../DefaultManagedIdentity";
import OnlineCopyEnabled from "../OnlineCopyEnabled";
import PointInTimeRestore from "../PointInTimeRestore";

// Define a typed config for permission sections
export interface PermissionSectionConfig {
    id: string;
    title: string;
    Component: React.FC;
    shouldShow?: (state: CopyJobContextState) => boolean; // optional conditional rendering
}

// Base permission sections with dynamic visibility logic
const PERMISSION_SECTIONS_CONFIG: PermissionSectionConfig[] = [
    {
        id: "addManagedIdentity",
        title: ContainerCopyMessages.addManagedIdentity.title,
        Component: AddManagedIdentity,
    },
    {
        id: "defaultManagedIdentity",
        title: ContainerCopyMessages.defaultManagedIdentity.title,
        Component: DefaultManagedIdentity,
    },
    {
        id: "readPermissionAssigned",
        title: ContainerCopyMessages.readPermissionAssigned.title,
        Component: AddReadPermissionToDefaultIdentity,
    }
];

const PERMISSION_SECTIONS_FOR_ONLINE_JOBS: PermissionSectionConfig[] = [
    {
        id: "pointInTimeRestore",
        title: ContainerCopyMessages.pointInTimeRestore.title,
        Component: PointInTimeRestore,
    },
    {
        id: "onlineCopyEnabled",
        title: ContainerCopyMessages.onlineCopyEnabled.title,
        Component: OnlineCopyEnabled,
    }
];

const usePermissionSections = (state: CopyJobContextState): PermissionSectionConfig[] => {
    return [
        ...PERMISSION_SECTIONS_CONFIG,
        ...(state.migrationType !== CopyJobMigrationType.Offline ? PERMISSION_SECTIONS_FOR_ONLINE_JOBS : []),
    ];
};

export default usePermissionSections;