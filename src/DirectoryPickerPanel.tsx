import { Panel, PanelType, ChoiceGroup } from "office-ui-fabric-react";
import * as React from "react";
import { useDirectories } from "./hooks/useDirectories";

interface Props {
  isOpen: boolean;
  dismissPanel: () => void;
  tenantId: string;
  armToken: string;
}

export const DirectoryPickerPanel: React.FunctionComponent<Props> = ({
  isOpen,
  dismissPanel,
  armToken,
  tenantId
}: Props) => {
  const directories = useDirectories(armToken);
  return (
    <Panel
      type={PanelType.medium}
      headerText="Select Directory"
      isOpen={isOpen}
      onDismiss={dismissPanel}
      closeButtonAriaLabel="Close"
    >
      <ChoiceGroup
        options={directories.map(dir => ({ key: dir.tenantId, text: `${dir.displayName} (${dir.tenantId})` }))}
        selectedKey={tenantId}
        onChange={async () => {
          dismissPanel();
          // TODO!!! Switching directories does not work. Still not sure why. Tried lots of stuff.
          // const response = await msal.loginPopup({
          //   authority: `https://login.microsoftonline.com/${option.key}`
          // });
          // // msal = new Msal.UserAgentApplication({
          // //   auth: {
          // //     authority: `https://login.microsoftonline.com/${option.key}`,
          // //     clientId: "203f1145-856a-4232-83d4-a43568fba23d",
          // //     redirectUri: "https://dataexplorer-dev.azurewebsites.net" // TODO! This should only be set in development
          // //   }
          // // });
          // setTenantId(option.key);
          // setAccount(response.account);
          // console.log(account);
        }}
      />
    </Panel>
  );
};
