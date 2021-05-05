import { DefaultButton } from "@fluentui/react";
import * as React from "react";

interface Props {
  login: () => void;
}

export const SignInButton: React.FunctionComponent<Props> = ({ login }: Props) => {
  return (
    <DefaultButton
      className="mecontrolSigninButton"
      text="Sign In"
      onClick={login}
      styles={{
        rootHovered: { backgroundColor: "#393939", color: "#fff" },
        rootFocused: { backgroundColor: "#393939", color: "#fff" },
        rootPressed: { backgroundColor: "#393939", color: "#fff" },
      }}
    />
  );
};
