import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import Explorer from "../Explorer";
import { JunoClient } from "../../Juno/JunoClient";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import { GenericRightPaneComponent, GenericRightPaneProps } from "./GenericRightPaneComponent";
import { PublishNotebookPaneComponent, PublishNotebookPaneProps } from "./PublishNotebookPaneComponent";
import { ImmutableNotebook } from "@nteract/commutable/src";
import { toJS } from "@nteract/commutable";
import { CodeOfConductComponent } from "../Controls/NotebookGallery/CodeOfConductComponent";
import { HttpStatusCodes } from "../../Common/Constants";
import { handleError, getErrorMessage } from "../../Common/ErrorHandlingUtils";
import { GalleryTab } from "../Controls/NotebookGallery/GalleryViewerComponent";

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
  private isLinkInjectionEnabled: boolean;

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
      onError: this.createFormErrorForLargeImageSelection,
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
    parentDomElement: HTMLElement,
    isLinkInjectionEnabled: boolean
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
    this.isLinkInjectionEnabled = isLinkInjectionEnabled;
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

    try {
      if (!this.name || !this.description || !this.author) {
        throw new Error("Name, description, and author are required");
      }

      const response = await this.junoClient.publishNotebook(
        this.name,
        this.description,
        this.tags?.split(","),
        this.author,
        this.imageSrc,
        this.content,
        this.isLinkInjectionEnabled
      );

      const data = response.data;
      if (data) {
        if (data.pendingScanJobIds?.length > 0) {
          NotificationConsoleUtils.logConsoleInfo(
            `Content of ${this.name} is currently being scanned for illegal content. It will not be available in the public gallery until the review is complete (may take a few days).`
          );
        } else {
          NotificationConsoleUtils.logConsoleInfo(`Published ${this.name} to gallery`);
          this.container.openGallery(GalleryTab.Published);
        }
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.formError = `Failed to publish ${this.name} to gallery`;
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

  private createFormErrorForLargeImageSelection = (formError: string, formErrorDetail: string, area: string): void => {
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
    this.isLinkInjectionEnabled = undefined;
  };
}
