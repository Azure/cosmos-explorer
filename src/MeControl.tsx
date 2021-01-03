import {
  FocusZone,
  DefaultButton,
  DirectionalHint,
  Persona,
  PersonaInitialsColor,
  PersonaSize
} from "office-ui-fabric-react";
import * as React from "react";
import { Account } from "msal";
import { useGraphPhoto } from "./hooks/useGraphPhoto";

interface Props {
  graphToken: string;
  account: Account;
  openPanel: () => void;
  logout: () => void;
}

export const MeControl: React.FunctionComponent<Props> = ({ openPanel, logout, account, graphToken }: Props) => {
  const photo = useGraphPhoto(graphToken);
  return (
    <FocusZone>
      <DefaultButton
        id="mecontrolHeader"
        className="mecontrolHeaderButton"
        menuProps={{
          className: "mecontrolContextualMenu",
          isBeakVisible: false,
          directionalHintFixed: true,
          directionalHint: DirectionalHint.bottomRightEdge,
          calloutProps: {
            minPagePadding: 0
          },
          items: [
            {
              key: "SwitchDirectory",
              text: "Switch Directory",
              onClick: openPanel
            },
            {
              key: "SignOut",
              text: "Sign Out",
              onClick: logout
            }
          ]
        }}
        styles={{
          rootHovered: { backgroundColor: "#393939" },
          rootFocused: { backgroundColor: "#393939" },
          rootPressed: { backgroundColor: "#393939" },
          rootExpanded: { backgroundColor: "#393939" }
        }}
      >
        <Persona
          imageUrl={photo}
          text={account?.name}
          secondaryText={account?.userName}
          showSecondaryText={true}
          showInitialsUntilImageLoads={true}
          initialsColor={PersonaInitialsColor.teal}
          size={PersonaSize.size28}
          className="mecontrolHeaderPersona"
        />
      </DefaultButton>
    </FocusZone>
  );
};
