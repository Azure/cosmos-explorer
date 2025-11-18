import { Button as FluentButton, makeStyles, tokens } from "@fluentui/react-components";
import * as React from "react";

export type CustomButtonProps = {
  primary?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: (ev: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

const useStyles = makeStyles({
  button: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1Hover,
    },
    "&:active": {
      backgroundColor: tokens.colorNeutralBackground1Pressed,
      color: tokens.colorNeutralForeground1Pressed,
    },
  },
  primary: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    "&:hover": {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
    "&:active": {
      backgroundColor: tokens.colorBrandBackgroundPressed,
    },
  },
});

export const Button = React.forwardRef<HTMLButtonElement, CustomButtonProps>(({ primary, ...props }, ref) => {
  const baseStyles = useStyles();
  const buttonClassName = primary ? baseStyles.primary : baseStyles.button;

  return (
    <FluentButton {...props} ref={ref} appearance={primary ? "primary" : "secondary"} className={buttonClassName} />
  );
});

Button.displayName = "Button";
