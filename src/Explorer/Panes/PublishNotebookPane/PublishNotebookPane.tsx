import { ImmutableNotebook, toJS } from "@nteract/commutable";
import React, { FunctionComponent, useEffect, useState } from "react";
import { HttpStatusCodes } from "../../../Common/Constants";
import { getErrorMessage, getErrorStack, handleError } from "../../../Common/ErrorHandlingUtils";
import { useNotebookSnapshotStore } from "../../../hooks/useNotebookSnapshotStore";
import { JunoClient } from "../../../Juno/JunoClient";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceStart, traceSuccess } from "../../../Shared/Telemetry/TelemetryProcessor";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import { CodeOfConductComponent } from "../../Controls/NotebookGallery/CodeOfConductComponent";
import { GalleryTab } from "../../Controls/NotebookGallery/GalleryViewerComponent";
import Explorer from "../../Explorer";
import * as FileSystemUtil from "../../Notebook/FileSystemUtil";
import { SnapshotRequest } from "../../Notebook/NotebookComponent/types";
import {
  GenericRightPaneComponent,
  GenericRightPaneProps,
} from "../GenericRightPaneComponent/GenericRightPaneComponent";
import { PublishNotebookPaneComponent, PublishNotebookPaneProps } from "./PublishNotebookPaneComponent";

export interface PublishNotebookPaneAProps {
  explorer: Explorer;
  closePanel: () => void;
  openNotificationConsole: () => void;
  junoClient: JunoClient;
  name: string;
  author: string;
  notebookContent: string | ImmutableNotebook;
  notebookContentRef: string;
  onTakeSnapshot: (request: SnapshotRequest) => void;
}
export const PublishNotebookPane: FunctionComponent<PublishNotebookPaneAProps> = ({
  explorer: container,
  junoClient,
  closePanel,
  name,
  author,
  notebookContent,
  notebookContentRef,
  onTakeSnapshot,
}: PublishNotebookPaneAProps): JSX.Element => {
  const [isCodeOfConductAccepted, setIsCodeOfConductAccepted] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [formErrorDetail, setFormErrorDetail] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>();

  const [notebookName, setNotebookName] = useState<string>(name);
  const [notebookDescription, setNotebookDescription] = useState<string>("");
  const [notebookTags, setNotebookTags] = useState<string>("");
  const [imageSrc, setImageSrc] = useState<string>();
  const { snapshot: notebookSnapshot, error: notebookSnapshotError } = useNotebookSnapshotStore();

  const CodeOfConductAccepted = async () => {
    try {
      const response = await junoClient.isCodeOfConductAccepted();
      if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
        throw new Error(`Received HTTP ${response.status} when accepting code of conduct`);
      }
      setIsCodeOfConductAccepted(response.data);
    } catch (error) {
      handleError(
        error,
        "PublishNotebookPaneAdapter/isCodeOfConductAccepted",
        "Failed to check if code of conduct was accepted"
      );
    }
  };
  const [notebookObject, setNotebookObject] = useState<ImmutableNotebook>();
  useEffect(() => {
    CodeOfConductAccepted();
    let newContent;
    if (typeof notebookContent === "string") {
      newContent = notebookContent as string;
    } else {
      newContent = JSON.stringify(toJS(notebookContent));
      setNotebookObject(notebookContent);
    }
    setContent(newContent);
  }, []);

  useEffect(() => {
    setImageSrc(notebookSnapshot);
  }, [notebookSnapshot]);

  useEffect(() => {
    setFormError(notebookSnapshotError);
  }, [notebookSnapshotError]);

  const submit = async (): Promise<void> => {
    const clearPublishingMessage = NotificationConsoleUtils.logConsoleProgress(`Publishing ${name} to gallery`);
    setIsExecuting(true);

    let startKey: number;

    if (!notebookName || !notebookDescription || !author || !imageSrc) {
      setFormError(`Failed to publish ${notebookName} to gallery`);
      setFormErrorDetail("Name, description, author and cover image are required");
      createFormError(formError, formErrorDetail, "PublishNotebookPaneAdapter/submit");
      setIsExecuting(false);
      return;
    }

    try {
      startKey = traceStart(Action.NotebooksGalleryPublish, {});

      const response = await junoClient.publishNotebook(
        notebookName,
        notebookDescription,
        notebookTags?.split(","),
        author,
        imageSrc,
        content
      );

      const data = response.data;
      if (data) {
        let isPublishPending = false;

        if (data.pendingScanJobIds?.length > 0) {
          isPublishPending = true;
          NotificationConsoleUtils.logConsoleInfo(
            `Content of ${name} is currently being scanned for illegal content. It will not be available in the public gallery until the review is complete (may take a few days).`
          );
        } else {
          NotificationConsoleUtils.logConsoleInfo(`Published ${notebookName} to gallery`);
          container.openGallery(GalleryTab.Published);
        }

        traceSuccess(
          Action.NotebooksGalleryPublish,
          {
            notebookId: data.id,
            isPublishPending,
          },
          startKey
        );
      }
    } catch (error) {
      traceFailure(
        Action.NotebooksGalleryPublish,
        {
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey
      );

      const errorMessage = getErrorMessage(error);
      setFormError(`Failed to publish ${FileSystemUtil.stripExtension(notebookName, "ipynb")} to gallery`);
      setFormErrorDetail(`${errorMessage}`);
      handleError(errorMessage, "PublishNotebookPaneAdapter/submit", formError);
      return;
    } finally {
      clearPublishingMessage();
      setIsExecuting(false);
    }

    closePanel();
  };

  const createFormError = (formError: string, formErrorDetail: string, area: string): void => {
    setFormError(formError);
    setFormErrorDetail(formErrorDetail);
    handleError(formErrorDetail, area, formError);
  };

  const clearFormError = (): void => {
    setFormError("");
    setFormErrorDetail("");
  };

  const props: GenericRightPaneProps = {
    formError: formError,
    formErrorDetail: formErrorDetail,
    id: "publishnotebookpane",
    isExecuting: isExecuting,
    title: "Publish to gallery",
    submitButtonText: "Publish",
    onSubmit: () => submit(),
    onClose: closePanel,
    expandConsole: () => container.expandConsole(),
    isSubmitButtonHidden: !isCodeOfConductAccepted,
  };

  const publishNotebookPaneProps: PublishNotebookPaneProps = {
    notebookDescription,
    notebookTags,
    imageSrc,
    notebookName,
    notebookAuthor: author,
    notebookCreatedDate: new Date().toISOString(),
    notebookObject: notebookObject,
    notebookContentRef,
    onError: createFormError,
    clearFormError: clearFormError,
    setNotebookName,
    setNotebookDescription,
    setNotebookTags,
    setImageSrc,
    onTakeSnapshot,
  };
  return (
    <GenericRightPaneComponent {...props}>
      {!isCodeOfConductAccepted ? (
        <div style={{ padding: "25px", marginTop: "10px" }}>
          <CodeOfConductComponent
            junoClient={junoClient}
            onAcceptCodeOfConduct={(isAccepted) => {
              setIsCodeOfConductAccepted(isAccepted);
            }}
          />
        </div>
      ) : (
        <PublishNotebookPaneComponent {...publishNotebookPaneProps} />
      )}
    </GenericRightPaneComponent>
  );
};
