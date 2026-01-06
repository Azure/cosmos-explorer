import { Overlay, Spinner, SpinnerSize } from "@fluentui/react";
import React from "react";

interface LoadingOverlayProps {
  isLoading: boolean;
  label: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, label }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <Overlay
      data-test="loading-overlay"
      styles={{
        root: {
          backgroundColor: "rgba(255,255,255,0.9)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <Spinner size={SpinnerSize.large} label={label} styles={{ label: { fontWeight: 600 } }} />
    </Overlay>
  );
};

export default LoadingOverlay;
