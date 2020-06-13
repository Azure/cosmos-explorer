import { Notebook } from "@nteract/commutable";
import * as Logger from "../../Common/Logger";
import * as ViewModels from "../../Contracts/ViewModels";
import { JunoClient } from "../../Juno/JunoClient";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";
import { PublishNotebookComponentProps } from "../Controls/NotebookGallery/PublishNotebookComponent";
import { PublishNotebookComponentAdapter } from "../Controls/NotebookGallery/PublishNotebookComponentAdapter";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";

export class PublishNotebookPane extends ContextualPaneBase {
  private junoClient: JunoClient;
  private publishNotebookComponentProps: PublishNotebookComponentProps;
  private publishNotebookComponentAdapter: PublishNotebookComponentAdapter;

  constructor(options: ViewModels.PublishNotebookPaneOptions) {
    super(options);

    this.junoClient = options.junoClient;

    this.publishNotebookComponentProps = {
      name: undefined,
      author: undefined,
      content: undefined,
      onPublishClick: this.publishNotebook,
      onCancelClick: this.cancelPublishing
    };

    this.publishNotebookComponentAdapter = new PublishNotebookComponentAdapter(this.publishNotebookComponentProps);
  }

  public openWithOptions(options: ViewModels.PublishNotebookPaneOpenOptions): void {
    this.isExecuting(false);

    this.publishNotebookComponentProps.name = options.name;
    this.publishNotebookComponentProps.author = options.author;
    this.publishNotebookComponentProps.content = options.content;

    this.publishNotebookComponentAdapter.triggerRender();

    super.open();
  }

  public close(): void {
    super.close();

    this.container.isPublishNotebookPaneEnabled(false);
  }

  private publishNotebook = async (description: string, tags: string, thumbnailUrl: string): Promise<void> => {
    const name = this.publishNotebookComponentProps.name;
    const notificationId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Publishing ${name} to gallery`
    );
    this.isExecuting(true);

    try {
      const author = this.publishNotebookComponentProps.author;
      const notebook: Notebook = JSON.parse(this.publishNotebookComponentProps.content);
      if (!name || !description || !author || !notebook) {
        throw new Error("Name, description, author, and notebook content are required");
      }

      const response = await this.junoClient.publishNotebookToGallery(
        name,
        description,
        tags?.split(","),
        author,
        thumbnailUrl,
        notebook
      );
      if (!response.data) {
        throw new Error(`Received HTTP ${response.status} when publishing ${name} to gallery`);
      }

      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, `Published ${name} to gallery`);
    } catch (error) {
      const message = `Failed to publish ${name} to gallery: ${error}`;
      Logger.logError(message, "PublishNotebookPane/publishNotebook");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
    }

    this.isExecuting(false);
    NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
    this.close();
  };

  private cancelPublishing = (): void => {
    this.cancel();
  };
}
