import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Spinner,
} from "@fluentui/react-components";
import { CheckmarkCircleRegular } from "@fluentui/react-icons";
import Explorer from "Explorer/Explorer";
import { checkContainerExists, createContainer, importData } from "Explorer/SplashScreen/SampleUtil";
import React, { useEffect, useState } from "react";
import * as ViewModels from "../../Contracts/ViewModels";

/**
 * This dialog:
 * - creates a container
 * - imports data into the container
 * @param props
 * @returns
 */
export const SampleDataImportDialog: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
  explorer: Explorer;
  databaseName: string;
}> = (props) => {
  const [status, setStatus] = useState<"idle" | "creating" | "importing" | "completed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerName = "sampledata";
  const [collection, setCollection] = useState<ViewModels.Collection>(undefined);

  useEffect(() => {
    // Reset state when dialog opens
    if (props.open) {
      setStatus("idle");
      setErrorMessage(null);
    }
  }, [props.open]);

  const handleStartImport = async (): Promise<void> => {
    setStatus("creating");
    const containerName = "sampledata";
    const databaseName = props.databaseName;
    if (checkContainerExists(databaseName, containerName)) {
      const msg = `The container ${containerName} in database ${databaseName} already exists. Please delete it and retry.`;
      setStatus("error");
      setErrorMessage(msg);
      return;
    }

    let collection;
    try {
      collection = await createContainer(databaseName, containerName, props.explorer);
    } catch (error) {
      setStatus("error");
      setErrorMessage(`Failed to create container: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

    try {
      setStatus("importing");
      await importData(collection);
      setCollection(collection);
      setStatus("completed");
    } catch (error) {
      setStatus("error");
      setErrorMessage(`Failed to import data: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleActionOnClick = () => {
    switch (status) {
      case "idle":
        handleStartImport();
        break;
      case "error":
        props.setOpen(false);
        break;
      case "creating":
      case "importing":
        props.setOpen(false);
        break;
      case "completed":
        props.setOpen(false);
        collection.openTab();
        break;
    }
  };

  const renderContent = () => {
    switch (status) {
      case "idle":
        return `Create a container ${containerName} and import sample data into it. This may take a few minutes.`;
      case "creating":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Spinner labelPosition="above" label={`Creating container ${containerName}...`} />
          </div>
        );
      case "importing":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Spinner labelPosition="above" label={`Importing sample data into container ${containerName}...`} />
            <span></span>
          </div>
        );
      case "completed":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckmarkCircleRegular />
            <span>Successfully created container and imported sample data!</span>
          </div>
        );
      case "error":
        return (
          <div style={{ color: "red" }}>
            <div>Error: {errorMessage}</div>
          </div>
        );
    }
  };

  const getButtonLabel = () => {
    switch (status) {
      case "idle":
        return "Start";
      case "creating":
      case "importing":
        return "Close";
      case "completed":
        return "Close";
      case "error":
        return "Close";
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={(event, data) => props.setOpen(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Importing Sample Data</DialogTitle>
          <DialogContent>{renderContent()}</DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={handleActionOnClick}>
              {getButtonLabel()}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
