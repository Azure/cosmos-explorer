import { toJS } from "@nteract/commutable";
import { ImmutableNotebook } from "@nteract/commutable/src";
import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { HttpStatusCodes } from "../../Common/Constants";
import { getErrorMessage, getErrorStack, handleError } from "../../Common/ErrorHandlingUtils";
import { JunoClient } from "../../Juno/JunoClient";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceStart, traceSuccess } from "../../Shared/Telemetry/TelemetryProcessor";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import { CodeOfConductComponent } from "../Controls/NotebookGallery/CodeOfConductComponent";
import { GalleryTab } from "../Controls/NotebookGallery/GalleryViewerComponent";
import Explorer from "../Explorer";
import * as FileSystemUtil from "../Notebook/FileSystemUtil";
import {
  GenericRightPaneComponent,
  GenericRightPaneProps,
} from "./GenericRightPaneComponent/GenericRightPaneComponent";
import { PublishNotebookPaneComponent, PublishNotebookPaneProps } from "./PublishNotebookPaneComponent";

export class PublishNotebookPaneAdapter implements ReactAdapter {
  parameters: ko.Observable<number>;
  private isOpened: boolean;
  private isExecuting: boolean;
  private formError: string;
  private formErrorDetail: string;

  private name: string;
  private author: string;
  private content: string;
  private description: string;
  private tags: string;
  private imageSrc: string;
  private notebookObject: ImmutableNotebook;
  private parentDomElement: HTMLElement;
  private isCodeOfConductAccepted: boolean;

  constructor(private container: Explorer, private junoClient: JunoClient) {
    this.parameters = ko.observable(Date.now());
    this.reset();
    this.triggerRender();
  }

  public renderComponent(): JSX.Element {
    if (!this.isOpened) {
      return undefined;
    }

    const props: GenericRightPaneProps = {
      container: this.container,
      formError: this.formError,
      formErrorDetail: this.formErrorDetail,
      id: "publishnotebookpane",
      isExecuting: this.isExecuting,
      title: "Publish to gallery",
      submitButtonText: "Publish",
      onClose: () => this.close(),
      onSubmit: () => this.submit(),
      isSubmitButtonHidden: !this.isCodeOfConductAccepted,
    };

    const publishNotebookPaneProps: PublishNotebookPaneProps = {
      notebookName: this.name,
      notebookDescription: "",
      notebookTags: "",
      notebookAuthor: this.author,
      notebookCreatedDate: new Date().toISOString(),
      notebookObject: this.notebookObject,
      notebookParentDomElement: this.parentDomElement,
      onChangeName: (newValue: string) => (this.name = newValue),
      onChangeDescription: (newValue: string) => (this.description = newValue),
      onChangeTags: (newValue: string) => (this.tags = newValue),
      onChangeImageSrc: (newValue: string) => (this.imageSrc = newValue),
      onError: this.createFormError,
      clearFormError: this.clearFormError,
    };

    return (
      <GenericRightPaneComponent {...props}>
        {!this.isCodeOfConductAccepted ? (
          <div style={{ padding: "15px", marginTop: "10px" }}>
            <CodeOfConductComponent
              junoClient={this.junoClient}
              onAcceptCodeOfConduct={() => {
                this.isCodeOfConductAccepted = true;
                this.triggerRender();
              }}
            />
          </div>
        ) : (
          <PublishNotebookPaneComponent {...publishNotebookPaneProps} />
        )}
      </GenericRightPaneComponent>
    );
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }

  public async open(
    name: string,
    author: string,
    notebookContent: string | ImmutableNotebook,
    parentDomElement: HTMLElement
  ): Promise<void> {
    try {
      const response = await this.junoClient.isCodeOfConductAccepted();
      if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
        throw new Error(`Received HTTP ${response.status} when accepting code of conduct`);
      }

      this.isCodeOfConductAccepted = response.data;
    } catch (error) {
      handleError(
        error,
        "PublishNotebookPaneAdapter/isCodeOfConductAccepted",
        "Failed to check if code of conduct was accepted"
      );
    }

    this.name = name;
    this.author = author;
    if (typeof notebookContent === "string") {
      this.content = notebookContent as string;
    } else {
      this.content = JSON.stringify(toJS(notebookContent));
      this.notebookObject = notebookContent;
    }
    this.parentDomElement = parentDomElement;

    this.isOpened = true;
    this.triggerRender();
  }

  public close(): void {
    this.reset();
    this.triggerRender();
  }

  public async submit(): Promise<void> {
    const clearPublishingMessage = NotificationConsoleUtils.logConsoleProgress(`Publishing ${this.name} to gallery`);
    this.isExecuting = true;
    this.triggerRender();

    let startKey: number;

    if (!this.name || !this.description || !this.author || !this.imageSrc) {
      const formError = `Failed to publish ${this.name} to gallery`;
      const formErrorDetail = "Name, description, author and cover image are required";
      this.createFormError(formError, formErrorDetail, "PublishNotebookPaneAdapter/submit");
      this.isExecuting = false;
      return;
    }

    try {
      startKey = traceStart(Action.NotebooksGalleryPublish, {});

      const response = await this.junoClient.publishNotebook(
        this.name,
        this.description,
        this.tags?.split(","),
        this.author,
        this.imageSrc,
        this.content
      );

      const data = response.data;
      if (data) {
        let isPublishPending = false;

        if (data.pendingScanJobIds?.length > 0) {
          isPublishPending = true;
          NotificationConsoleUtils.logConsoleInfo(
            `Content of ${this.name} is currently being scanned for illegal content. It will not be available in the public gallery until the review is complete (may take a few days).`
          );
        } else {
          NotificationConsoleUtils.logConsoleInfo(`Published ${this.name} to gallery`);
          this.container.openGallery(GalleryTab.Published);
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
      this.formError = `Failed to publish ${FileSystemUtil.stripExtension(this.name, "ipynb")} to gallery`;
      this.formErrorDetail = `${errorMessage}`;
      handleError(errorMessage, "PublishNotebookPaneAdapter/submit", this.formError);
      return;
    } finally {
      clearPublishingMessage();
      this.isExecuting = false;
      this.triggerRender();
    }

    this.close();
  }

  private createFormError = (formError: string, formErrorDetail: string, area: string): void => {
    this.formError = formError;
    this.formErrorDetail = formErrorDetail;
    handleError(formErrorDetail, area, formError);
    this.triggerRender();
  };

  private clearFormError = (): void => {
    this.formError = undefined;
    this.formErrorDetail = undefined;
    this.triggerRender();
  };

  private reset = (): void => {
    this.isOpened = false;
    this.isExecuting = false;
    this.formError = undefined;
    this.formErrorDetail = undefined;
    this.name = undefined;
    this.author = undefined;
    this.content = undefined;
    this.description = undefined;
    this.tags = undefined;
    this.imageSrc = undefined;
    this.notebookObject = undefined;
    this.parentDomElement = undefined;
    this.isCodeOfConductAccepted = undefined;
  };
}
