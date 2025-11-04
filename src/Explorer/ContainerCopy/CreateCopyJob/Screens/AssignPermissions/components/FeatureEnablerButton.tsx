import { PrimaryButton, Stack } from "@fluentui/react";
import React from "react";
import { useCopyJobContext } from "../../../../Context/CopyJobContext";
import { buildResourceLink } from "../../../../CopyJobUtils";
import useFetchSourceAccountEventHandler from "../hooks/useFetchSourceAccountEventHandler";
import useWindowOpenMonitor from "../hooks/useWindowOpenMonitor";
import { FeatureEnablerButtonProps } from "../types/FeatureEnablerTypes";

const FeatureEnablerButton: React.FC<FeatureEnablerButtonProps> = ({
  containerClassName,
  description,
  buttonText,
  urlPath,
  errorMessage,
}) => {
  const { copyJobState: { source } = {} } = useCopyJobContext();
  const sourceAccountLink = buildResourceLink(source?.account);
  const featureUrl = `${sourceAccountLink}${urlPath}`;
  const { loading, onWindowClosed } = useFetchSourceAccountEventHandler();

  const openWindowAndMonitor = useWindowOpenMonitor(featureUrl, onWindowClosed.bind(null, errorMessage));

  return (
    <Stack className={containerClassName} tokens={{ childrenGap: 15, padding: "0 0 0 20px" }}>
      <div className="toggle-label">{description}</div>
      <PrimaryButton
        text={loading ? "" : buttonText}
        {...(loading ? { iconProps: { iconName: "SyncStatusSolid" } } : {})}
        disabled={loading}
        onClick={openWindowAndMonitor}
      />
    </Stack>
  );
};

export default FeatureEnablerButton;
