import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as Logger from "../../Common/Logger";
import Explorer from "../Explorer";
import { JunoClient } from "../../Juno/JunoClient";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { GenericRightPaneComponent, GenericRightPaneProps } from "./GenericRightPaneComponent";
import { PublishNotebookPaneComponent, PublishNotebookPaneProps } from "./PublishNotebookPaneComponent";
import { ImmutableNotebook } from "@nteract/commutable/src";
import { toJS } from "@nteract/commutable";
import { CodeOfConductComponent } from "../Controls/NotebookGallery/CodeOfConductComponent";
import { HttpStatusCodes } from "../../Common/Constants";

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
      content: this.createContent(),
      formError: this.formError,
      formErrorDetail: this.formErrorDetail,
      id: "publishnotebookpane",
      isExecuting: this.isExecuting,
      title: "Publish to gallery",
      submitButtonText: "Publish",
      onClose: () => this.close(),
      onSubmit: () => this.submit(),
      isSubmitButtonVisible: this.isCodeOfConductAccepted
    };

    return <GenericRightPaneComponent {...props} />;
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }

  public async open(
    name: string,
    author: string,
    notebookContent: string | ImmutableNotebook,
    parentDomElement: HTMLElement,
    isCodeOfConductEnabled: boolean,
    isLinkInjectionEnabled: boolean
  ): Promise<void> {
    if (isCodeOfConductEnabled) {
      try {
        const response = await this.junoClient.isCodeOfConductAccepted();
        if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
          throw new Error(`Received HTTP ${response.status} when accepting code of conduct`);
        }

        this.isCodeOfConductAccepted = response.data;
      } catch (error) {
        const message = `Failed to check if code of conduct was accepted: ${error}`;
        Logger.logError(message, "PublishNotebookPaneAdapter/isCodeOfConductAccepted");
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
      }
    } else {
      this.isCodeOfConductAccepted = true;
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
    const notificationId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Publishing ${this.name} to gallery`
    );
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
      if (response.data) {
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, `Published ${name} to gallery`);
      }
    } catch (error) {
      this.formError = `Failed to publish ${this.name} to gallery`;
      this.formErrorDetail = `${error}`;

      const message = `${this.formError}: ${this.formErrorDetail}`;
      Logger.logError(message, "PublishNotebookPaneAdapter/submit");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
      return;
    } finally {
      NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
      this.isExecuting = false;
      this.triggerRender();
    }

    this.close();
  }

  private createFormErrorForLargeImageSelection = (formError: string, formErrorDetail: string, area: string): void => {
    this.formError = formError;
    this.formErrorDetail = formErrorDetail;

    const message = `${this.formError}: ${this.formErrorDetail}`;
    Logger.logError(message, area);
    NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
    this.triggerRender();
  };

  private clearFormError = (): void => {
    this.formError = undefined;
    this.formErrorDetail = undefined;
    this.triggerRender();
  };

  private createContent = (): JSX.Element => {
    const publishNotebookPaneProps: PublishNotebookPaneProps = {
      notebookName: this.name,
      notebookDescription: "",
      notebookTags: "",
      notebookAuthor: this.author,
      notebookCreatedDate: new Date().toISOString(),
      notebookObject: this.notebookObject,
      notebookParentDomElement: this.parentDomElement,
      onChangeDescription: (newValue: string) => (this.description = newValue),
      onChangeTags: (newValue: string) => (this.tags = newValue),
      onChangeImageSrc: (newValue: string) => (this.imageSrc = newValue),
      onError: this.createFormErrorForLargeImageSelection,
      clearFormError: this.clearFormError
    };

    return !this.isCodeOfConductAccepted ? (
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
    );
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
