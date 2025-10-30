import { PermissionSectionConfig } from "../hooks/usePermissionsSection";

export interface FeatureEnablerConfig {
  /** CSS class name for the container */
  containerClassName: string;
  /** Description text to display above the button */
  description: string;
  /** Text to display on the button when not loading */
  buttonText: string;
  /** URL path to append to the source account link */
  urlPath: string;
  /** Error message prefix for logging */
  errorMessage: string;
}

export interface FeatureEnablerButtonProps extends FeatureEnablerConfig, Partial<PermissionSectionConfig> {}
