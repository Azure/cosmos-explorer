import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { FeatureEnablerConfig } from "../types/FeatureEnablerTypes";

export const FEATURE_CONFIGS: Record<string, FeatureEnablerConfig> = {
  ONLINE_COPY: {
    containerClassName: "onlineCopyContainer",
    description: ContainerCopyMessages.onlineCopyEnabled.description,
    buttonText: ContainerCopyMessages.onlineCopyEnabled.buttonText,
    urlPath: "/Features",
    errorMessage: "Error fetching database account after Online Copy Feature window closed:",
  },
  POINT_IN_TIME_RESTORE: {
    containerClassName: "pointInTimeRestoreContainer",
    description: ContainerCopyMessages.pointInTimeRestore.description,
    buttonText: ContainerCopyMessages.pointInTimeRestore.buttonText,
    urlPath: "/backupRestore",
    errorMessage: "Error fetching database account after PITR window closed:",
  },
} as const;
