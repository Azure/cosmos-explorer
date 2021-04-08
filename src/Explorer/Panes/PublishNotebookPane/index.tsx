import { ImmutableNotebook, toJS } from "@nteract/commutable";
import React, { FunctionComponent, useEffect, useState } from "react";
import { HttpStatusCodes } from "../../../Common/Constants";
import { getErrorMessage, getErrorStack, handleError } from "../../../Common/ErrorHandlingUtils";
import { JunoClient } from "../../../Juno/JunoClient";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceStart, traceSuccess } from "../../../Shared/Telemetry/TelemetryProcessor";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import { CodeOfConductComponent } from "../../Controls/NotebookGallery/CodeOfConductComponent";
import { GalleryTab } from "../../Controls/NotebookGallery/GalleryViewerComponent";
import Explorer from "../../Explorer";
import * as FileSystemUtil from "../../Notebook/FileSystemUtil";
import { GenericRightPaneComponent, GenericRightPaneProps } from "../GenericRightPaneComponent";
import { PublishNotebookPaneComponent, PublishNotebookPaneProps } from "./PublishNotebookPaneComponent";

export interface PublishNotebookPaneAProps {
  explorer: Explorer;
  closePanel: () => void;
  openNotificationConsole: () => void;
  junoClient: JunoClient;
  name: string;
  author: string;
  notebookContent: string | ImmutableNotebook;
  parentDomElement: HTMLElement;
}
export const PublishNotebookPane: FunctionComponent<PublishNotebookPaneAProps> = ({
  explorer: container,
  junoClient,
  closePanel,
  name,
  author,
  notebookContent,
  parentDomElement,
}: PublishNotebookPaneAProps): JSX.Element => {
  const isOpened = true;
  const [isCodeOfConductAccepted, setIsCodeOfConductAccepted] = useState<boolean>();
  const [content, setContent] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [formErrorDetail, setFormErrorDetail] = useState<string>("");

  let isExecuting: boolean;

  let description: string;
  let tags: string;
  let imageSrc: string;

  const props: GenericRightPaneProps = {
    container: container,
    formError: formError,
    formErrorDetail: formErrorDetail,
    id: "publishnotebookpane",
    isExecuting: isExecuting,
    title: "Publish to gallery",
    submitButtonText: "Publish",
    onSubmit: () => submit(),
    onClose: closePanel,
    isSubmitButtonHidden: !isCodeOfConductAccepted,
  };

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

  const submit = async (): Promise<void> => {
    const clearPublishingMessage = NotificationConsoleUtils.logConsoleProgress(`Publishing ${name} to gallery`);
    isExecuting = true;

    let startKey: number;

    if (!name || !description || !author || !imageSrc) {
      setFormError(`Failed to publish ${name} to gallery`);
      setFormErrorDetail("Name, description, author and cover image are required");
      createFormError(formError, formErrorDetail, "PublishNotebookPaneAdapter/submit");
      isExecuting = false;
      return;
    }

    try {
      startKey = traceStart(Action.NotebooksGalleryPublish, {});

      const response = await junoClient.publishNotebook(name, description, tags?.split(","), author, imageSrc, content);

      const data = response.data;
      if (data) {
        let isPublishPending = false;

        if (data.pendingScanJobIds?.length > 0) {
          isPublishPending = true;
          NotificationConsoleUtils.logConsoleInfo(
            `Content of ${name} is currently being scanned for illegal content. It will not be available in the public gallery until the review is complete (may take a few days).`
          );
        } else {
          NotificationConsoleUtils.logConsoleInfo(`Published ${name} to gallery`);
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
      setFormError(`Failed to publish ${FileSystemUtil.stripExtension(name, "ipynb")} to gallery`);
      setFormErrorDetail(`${errorMessage}`);
      handleError(errorMessage, "PublishNotebookPaneAdapter/submit", formError);
      return;
    } finally {
      clearPublishingMessage();
      isExecuting = false;
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

  const publishNotebookPaneProps: PublishNotebookPaneProps = {
    notebookAuthor: author,
    notebookCreatedDate: new Date().toISOString(),
    notebookObject: notebookObject,
    notebookParentDomElement: parentDomElement,
    onError: createFormError,
    clearFormError: clearFormError,
  };

  return !isOpened ? (
    <></>
  ) : (
    <GenericRightPaneComponent {...props}>
      {!isCodeOfConductAccepted ? (
        <div style={{ padding: "15px", marginTop: "10px" }}>
          <CodeOfConductComponent
            junoClient={junoClient}
            onAcceptCodeOfConduct={() => {
              setIsCodeOfConductAccepted(true);
            }}
          />
        </div>
      ) : (
        <PublishNotebookPaneComponent {...publishNotebookPaneProps} />
      )}
    </GenericRightPaneComponent>
  );
};
