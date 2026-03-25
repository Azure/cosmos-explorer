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
import { Keys, t } from "Localization";
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
      const msg = t(Keys.splashScreen.sampleDataDialog.errorContainerExists, { containerName, databaseName });
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
      setErrorMessage(
        t(Keys.splashScreen.sampleDataDialog.errorCreateContainer, {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return;
    }

    try {
      setStatus("importing");
      await importData(props.sampleDataConfiguration.sampleDataFile, collection);
      setCollection(collection);
      setStatus("completed");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        t(Keys.splashScreen.sampleDataDialog.errorImportData, {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
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
        return t(Keys.splashScreen.sampleDataDialog.createPrompt, { containerName });

      case "creating":
        return (
          <Spinner
            size="small"
            labelPosition="above"
            label={t(Keys.splashScreen.sampleDataDialog.creatingContainer, { containerName })}
          />
        );
      case "importing":
        return (
          <Spinner
            size="small"
            labelPosition="above"
            label={t(Keys.splashScreen.sampleDataDialog.importingData, { containerName })}
          />
        );
      case "completed":
        return t(Keys.splashScreen.sampleDataDialog.success, { containerName });
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
        return t(Keys.splashScreen.sampleDataDialog.startButton);
      case "creating":
      case "importing":
        return t(Keys.common.close);
      case "completed":
        return t(Keys.common.close);
      case "error":
        return t(Keys.common.close);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={(event, data) => props.setOpen(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{t(Keys.splashScreen.sampleDataDialog.title)}</DialogTitle>
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
