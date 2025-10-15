import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  Spinner,
  tokens,
} from "@fluentui/react-components";
import Explorer from "Explorer/Explorer";
import { checkContainerExists, createContainer, importData, SampleDataFile } from "Explorer/SplashScreen/SampleUtil";
import React, { useEffect, useState } from "react";
import * as ViewModels from "../../Contracts/ViewModels";

const useStyles = makeStyles({
  dialogContent: {
    alignItems: "center",
    marginBottom: tokens.spacingVerticalL,
  },
});

export interface SampleDataConfiguration {
  databaseName: string;
  newContainerName: string;
  sampleDataFile: SampleDataFile;
}

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
  sampleDataConfiguration: SampleDataConfiguration | undefined;
}> = (props) => {
  const [status, setStatus] = useState<"idle" | "creating" | "importing" | "completed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerName = props.sampleDataConfiguration?.newContainerName;
  const [collection, setCollection] = useState<ViewModels.Collection>(undefined);
  const styles = useStyles();

  useEffect(() => {
    // Reset state when dialog opens
    if (props.open) {
      setStatus("idle");
      setErrorMessage(undefined);
    }
  }, [props.open]);

  const handleStartImport = async (): Promise<void> => {
    setStatus("creating");
    const databaseName = props.sampleDataConfiguration.databaseName;
    if (checkContainerExists(databaseName, containerName)) {
      const msg = `The container "${containerName}" in database "${databaseName}" already exists. Please delete it and retry.`;
      setStatus("error");
      setErrorMessage(msg);
      return;
    }

    let collection;
    try {
      collection = await createContainer(
        databaseName,
        containerName,
        props.explorer,
        props.sampleDataConfiguration.sampleDataFile,
      );
    } catch (error) {
      setStatus("error");
      setErrorMessage(`Failed to create container: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

    try {
      setStatus("importing");
      await importData(props.sampleDataConfiguration.sampleDataFile, collection);
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
        return `Create a container "${containerName}" and import sample data into it. This may take a few minutes.`;

      case "creating":
        return <Spinner size="small" labelPosition="above" label={`Creating container "${containerName}"...`} />;
      case "importing":
        return <Spinner size="small" labelPosition="above" label={`Importing data into "${containerName}"...`} />;
      case "completed":
        return `Successfully created "${containerName}" with sample data.`;
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
          <DialogTitle>Sample Data</DialogTitle>
          <DialogContent>
            <div className={styles.dialogContent}>{renderContent()}</div>
          </DialogContent>
          <DialogActions>
            <Button
              appearance="primary"
              onClick={handleActionOnClick}
              disabled={status === "creating" || status === "importing"}
            >
              {getButtonLabel()}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
