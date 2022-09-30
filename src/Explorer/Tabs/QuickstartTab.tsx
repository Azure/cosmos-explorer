import { Spinner, SpinnerSize, Stack } from "@fluentui/react";
import { NotebookWorkspaceConnectionInfo } from "Contracts/DataModels";
import { NotebookTerminalComponent } from "Explorer/Controls/Notebook/NotebookTerminalComponent";
import Explorer from "Explorer/Explorer";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { QuickstartGuide } from "Explorer/Quickstart/QuickstartGuide";
import React, { useEffect } from "react";
import { userContext } from "UserContext";

interface QuickstartTabProps {
  explorer: Explorer;
}

export const QuickstartTab: React.FC<QuickstartTabProps> = ({ explorer }: QuickstartTabProps): JSX.Element => {
  const notebookServerInfo = useNotebook((state) => state.notebookServerInfo);
  useEffect(() => {
    explorer.allocateContainer();
  }, []);
  const getNotebookServerInfo = (): NotebookWorkspaceConnectionInfo => ({
    authToken: notebookServerInfo.authToken,
    notebookServerEndpoint: `${notebookServerInfo.notebookServerEndpoint?.replace(/\/+$/, "")}/postgresql`,
    forwardingId: notebookServerInfo.forwardingId,
  });

  return (
    <Stack style={{ width: "100%" }} horizontal>
      <Stack style={{ width: "50%" }}>
        <QuickstartGuide />
      </Stack>
      <Stack style={{ width: "50%", borderLeft: "black solid 1px" }}>
        {notebookServerInfo?.notebookServerEndpoint && (
          <NotebookTerminalComponent
            notebookServerInfo={getNotebookServerInfo()}
            databaseAccount={userContext.databaseAccount}
            tabId="EmbbedTerminal"
          />
        )}
        {!notebookServerInfo?.notebookServerEndpoint && (
          <Spinner styles={{ root: { marginTop: 10 } }} size={SpinnerSize.large}></Spinner>
        )}
      </Stack>
    </Stack>
  );
};
