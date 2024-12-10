import { Stack, Text } from "@fluentui/react";
import React from "react";
import { KeyCodes } from "../../Common/Constants";

interface SplashScreenButtonProps {
  imgSrc: string;
  title: string;
  description: string;
  onClick: () => void;
}

export const SplashScreenButton: React.FC<SplashScreenButtonProps> = ({
  imgSrc,
  title,
  description,
  onClick,
}: SplashScreenButtonProps): JSX.Element => {
  return (
    <Stack
      horizontal
      style={{
        border: "1px solid #949494",
        boxSizing: "border-box",
        boxShadow: "0 4px 4px rgba(0, 0, 0, 0.25)",
        borderRadius: 4,
        padding: "32px 16px",
        backgroundColor: "#ffffff",
        width: "100%",
        minHeight: 150,
      }}
      onClick={onClick}
      onKeyPress={(event: React.KeyboardEvent) => {
        if (event.charCode === KeyCodes.Space || event.charCode === KeyCodes.Enter) {
          onClick();
          event.stopPropagation();
        }
      }}
      tabIndex={0}
      role="button"
    >
      <div>
        <img src={imgSrc} alt={title} aria-hidden="true" />
      </div>
      <Stack style={{ marginLeft: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 600 }}>{title}</Text>
        <Text style={{ fontSize: 13 }}>{description}</Text>
      </Stack>
    </Stack>
  );
};
