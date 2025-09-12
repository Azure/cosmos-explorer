import { Stack, Text } from "@fluentui/react";
import { makeStyles } from "@fluentui/react-components";
import React from "react";
import { KeyCodes } from "../../Common/Constants";

interface SplashScreenButtonProps {
  imgSrc: string;
  title: string;
  description: string;
  onClick: () => void;
  imgSize?: number;
}

const useStyles = makeStyles({
  button: {
    border: "1px solid var(--colorNeutralStroke1)",
    boxSizing: "border-box",
    boxShadow: "var(--shadow4)",
    borderRadius: "4px",
    padding: "32px 16px",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
    width: "100%",
    minHeight: "150px",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
  },
  content: {
    marginLeft: "16px",
    textAlign: "left",
  },
  title: {
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    marginBottom: "8px",
  },
  description: {
    fontSize: "13px",
    color: "var(--colorNeutralForeground2)",
  },
});

export const SplashScreenButton: React.FC<SplashScreenButtonProps> = ({
  imgSrc,
  title,
  description,
  onClick,
  imgSize,
}: SplashScreenButtonProps): JSX.Element => {
  const styles = useStyles();

  return (
    <Stack
      horizontal
      className={styles.button}
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
        <img src={imgSrc} alt={title} aria-hidden="true" {...(imgSize ? { height: imgSize, width: imgSize } : {})} />
      </div>
      <Stack className={styles.content}>
        <Text className={styles.title}>{title}</Text>
        <Text className={styles.description}>{description}</Text>
      </Stack>
    </Stack>
  );
};
