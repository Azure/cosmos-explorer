import { IDropdownOption } from "office-ui-fabric-react";
import React, { FormEvent, FunctionComponent, useEffect, useState } from "react";
import { HttpStatusCodes } from "../../../Common/Constants";
import { getErrorMessage, handleError } from "../../../Common/ErrorHandlingUtils";
import { GitHubOAuthService } from "../../../GitHub/GitHubOAuthService";
import { IPinnedRepo, JunoClient } from "../../../Juno/JunoClient";
import * as GitHubUtils from "../../../Utils/GitHubUtils";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";
import { NotebookContentItem, NotebookContentItemType } from "../../Notebook/NotebookContentItem";
import { ResourceTreeAdapter } from "../../Tree/ResourceTreeAdapter";
import { GenericRightPaneComponent, GenericRightPaneProps } from "../GenericRightPaneComponent";
import { CopyNotebookPaneComponent, CopyNotebookPaneProps } from "./CopyNotebookPaneComponent";

interface Location {
  type: "MyNotebooks" | "GitHub";

  // GitHub
  owner?: string;
  repo?: string;
  branch?: string;
}
export interface CopyNotebookPanelProps {
  name: string;
  content: string;
  container: Explorer;
  junoClient: JunoClient;
  gitHubOAuthService: GitHubOAuthService;
  closePanel: () => void;
}

export const CopyNotebookPane: FunctionComponent<CopyNotebookPanelProps> = ({
  name,
  content,
  container,
  junoClient,
  gitHubOAuthService,
  closePanel,
}: CopyNotebookPanelProps) => {
  const [isExecuting, setIsExecuting] = useState<boolean>();
  const [formError, setFormError] = useState<string>("");
  const [formErrorDetail, setFormErrorDetail] = useState<string>("");
  const [pinnedRepos, setPinnedRepos] = useState<IPinnedRepo[]>();
  const [selectedLocation, setSelectedLocation] = useState<Location>();

  useEffect(() => {
    open();
  }, []);

  const open = async (): Promise<void> => {
    if (gitHubOAuthService.isLoggedIn()) {
      const response = await junoClient.getPinnedRepos(gitHubOAuthService.getTokenObservable()()?.scope);
      if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
        handleError(`Received HTTP ${response.status} when fetching pinned repos`, "CopyNotebookPaneAdapter/submit");
      }

      if (response.data?.length > 0) {
        setPinnedRepos(response.data);
      }
    }
  };

  const submit = async (): Promise<void> => {
    let destination: string = selectedLocation?.type;
    let clearMessage: () => void;
    setIsExecuting(true);

    try {
      if (!selectedLocation) {
        throw new Error(`No location selected`);
      }

      if (selectedLocation.type === "GitHub") {
        destination = `${destination} - ${GitHubUtils.toRepoFullName(
          selectedLocation.owner,
          selectedLocation.repo
        )} - ${selectedLocation.branch}`;
      }

      clearMessage = NotificationConsoleUtils.logConsoleProgress(`Copying ${name} to ${destination}`);

      const notebookContentItem = await copyNotebook(selectedLocation);
      if (!notebookContentItem) {
        throw new Error(`Failed to upload ${name}`);
      }

      NotificationConsoleUtils.logConsoleInfo(`Successfully copied ${name} to ${destination}`);
      closePanel();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setFormError(`Failed to copy ${name} to ${destination}`);
      setFormErrorDetail(`${errorMessage}`);
      handleError(errorMessage, "CopyNotebookPaneAdapter/submit", formError);
    } finally {
      clearMessage && clearMessage();
      setIsExecuting(false);
    }
  };

  const copyNotebook = async (location: Location): Promise<NotebookContentItem> => {
    let parent: NotebookContentItem;
    switch (location.type) {
      case "MyNotebooks":
        parent = {
          name: ResourceTreeAdapter.MyNotebooksTitle,
          path: container.getNotebookBasePath(),
          type: NotebookContentItemType.Directory,
        };
        break;

      case "GitHub":
        parent = {
          name: ResourceTreeAdapter.GitHubReposTitle,
          path: GitHubUtils.toContentUri(selectedLocation.owner, selectedLocation.repo, selectedLocation.branch, ""),
          type: NotebookContentItemType.Directory,
        };
        break;

      default:
        throw new Error(`Unsupported location type ${location.type}`);
    }

    return container.uploadFile(name, content, parent);
  };

  const onDropDownChange = (_: FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    setSelectedLocation(option?.data);
  };

  const genericPaneProps: GenericRightPaneProps = {
    container,
    formError,
    formErrorDetail,
    id: "copynotebookpane",
    isExecuting: isExecuting,
    title: "Copy notebook",
    submitButtonText: "OK",
    onClose: closePanel,
    onSubmit: () => submit(),
  };

  const copyNotebookPaneProps: CopyNotebookPaneProps = {
    name,
    pinnedRepos,
    onDropDownChange: onDropDownChange,
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <CopyNotebookPaneComponent {...copyNotebookPaneProps} />
    </GenericRightPaneComponent>
  );
};
