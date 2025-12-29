import { Overlay, Spinner, SpinnerSize } from "@fluentui/react";
import { useThemeStore } from "hooks/useTheme";
import React from "react";

interface LoadingOverlayProps {
  isLoading: boolean;
  label: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, label }) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  if (!isLoading) {
    return null;
  }

  return (
    <Overlay
      styles={{
        root: {
          backgroundColor: isDarkMode ? "rgba(32, 31, 30, 0.9)" : "rgba(255,255,255,0.9)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <Spinner
        size={SpinnerSize.large}
        label={label}
        styles={{ label: { fontWeight: 600, color: isDarkMode ? "#ffffff" : "#323130" } }}
      />
    </Overlay>
  );
};

export default LoadingOverlay;
