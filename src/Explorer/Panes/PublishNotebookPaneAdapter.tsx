import ko from "knockout";
import { ITextFieldProps, Stack, Text, TextField } from "office-ui-fabric-react";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as Logger from "../../Common/Logger";
import { JunoClient } from "../../Juno/JunoClient";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { FileSystemUtil } from "../Notebook/FileSystemUtil";
import { GenericRightPaneComponent, GenericRightPaneProps } from "./GenericRightPaneComponent";
import Explorer from "../Explorer";

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
  private thumbnailUrl: string;

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
      onSubmit: () => this.submit()
    };

    return <GenericRightPaneComponent {...props} />;
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }

  public open(name: string, author: string, content: string): void {
    this.name = name;
    this.author = author;
    this.content = content;

    this.isOpened = true;
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
        this.thumbnailUrl,
        this.content
      );
      if (!response.data) {
        throw new Error(`Received HTTP ${response.status} when publishing ${name} to gallery`);
      }

      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, `Published ${name} to gallery`);
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

  private createContent = (): JSX.Element => {
    const descriptionPara1 =
      "This notebook has your data. Please make sure you delete any sensitive data/output before publishing.";
    const descriptionPara2 = `Would you like to publish and share ${FileSystemUtil.stripExtension(
      this.name,
      "ipynb"
    )} to the gallery?`;
    const descriptionProps: ITextFieldProps = {
      label: "Description",
      ariaLabel: "Description",
      multiline: true,
      rows: 3,
      required: true,
      onChange: (event, newValue) => (this.description = newValue)
    };
    const tagsProps: ITextFieldProps = {
      label: "Tags",
      ariaLabel: "Tags",
      placeholder: "Optional tag 1, Optional tag 2",
      onChange: (event, newValue) => (this.tags = newValue)
    };
    const thumbnailProps: ITextFieldProps = {
      label: "Cover image url",
      ariaLabel: "Cover image url",
      onChange: (event, newValue) => (this.thumbnailUrl = newValue)
    };

    return (
      <div className="panelContent">
        <Stack className="paneMainContent" tokens={{ childrenGap: 20 }}>
          <Text>{descriptionPara1}</Text>
          <Text>{descriptionPara2}</Text>
          <TextField {...descriptionProps} />
          <TextField {...tagsProps} />
          <TextField {...thumbnailProps} />
        </Stack>
      </div>
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
  };
}
