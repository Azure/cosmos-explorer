import { LinkProps, DialogProps } from "../Explorer/Controls/DialogReactComponent/DialogComponent";
import { IGalleryItem, JunoClient } from "../Juno/JunoClient";
import * as ViewModels from "../Contracts/ViewModels";
import { NotificationConsoleUtils } from "./NotificationConsoleUtils";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import * as Logger from "../Common/Logger";
import {
  GalleryTab,
  SortBy,
  GalleryViewerComponent
} from "../Explorer/Controls/NotebookGallery/GalleryViewerComponent";

export interface DialogEnabledComponent {
  setDialogProps: (dialogProps: DialogProps) => void;
}

export enum NotebookViewerParams {
  NotebookUrl = "notebookUrl",
  GalleryItemId = "galleryItemId"
}

export interface NotebookViewerProps {
  notebookUrl: string;
  galleryItemId: string;
}

export enum GalleryViewerParams {
  SelectedTab = "tab",
  SortBy = "sort",
  SearchText = "q"
}

export interface GalleryViewerProps {
  selectedTab: GalleryTab;
  sortBy: SortBy;
  searchText: string;
}

export function showOkCancelModalDialog(
  component: DialogEnabledComponent,
  title: string,
  msg: string,
  linkProps: LinkProps,
  okLabel: string,
  onOk: () => void,
  cancelLabel: string,
  onCancel: () => void
): void {
  component.setDialogProps({
    linkProps,
    isModal: true,
    visible: true,
    title,
    subText: msg,
    primaryButtonText: okLabel,
    secondaryButtonText: cancelLabel,
    onPrimaryButtonClick: () => {
      component.setDialogProps(undefined);
      onOk && onOk();
    },
    onSecondaryButtonClick: () => {
      component.setDialogProps(undefined);
      onCancel && onCancel();
    }
  });
}

export function downloadItem(
  component: DialogEnabledComponent,
  container: ViewModels.Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void
): void {
  const name = data.name;

  if (container) {
    container.showOkCancelModalDialog(
      "Download to My Notebooks",
      `Download ${name} from gallery as a copy to your notebooks to run and/or edit the notebook.`,
      "Download",
      async () => {
        const notificationId = NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.InProgress,
          `Downloading ${name} to My Notebooks`
        );

        try {
          const response = await junoClient.getNotebookContent(data.id);
          if (!response.data) {
            throw new Error(`Received HTTP ${response.status} when fetching ${data.name}`);
          }

          await container.importAndOpenFromGallery(data.name, JSON.stringify(response.data));
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `Successfully downloaded ${name} to My Notebooks`
          );

          const increaseDownloadResponse = await junoClient.increaseNotebookDownloadCount(data.id);
          if (increaseDownloadResponse.data) {
            onComplete(increaseDownloadResponse.data.notebook);
          }
        } catch (error) {
          const message = `Failed to download ${data.name}: ${error}`;
          Logger.logError(message, "GalleryUtils/downloadItem");
          NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
        }

        NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
      },
      "Cancel",
      undefined
    );
  } else {
    showOkCancelModalDialog(
      component,
      "Edit/Run notebook in Cosmos DB data explorer",
      `In order to edit/run ${name} in Cosmos DB data explorer, a Cosmos DB account will be needed. If you do not have a Cosmos DB account yet, please create one.`,
      {
        linkText: "Learn more about Cosmos DB",
        linkUrl: "https://azure.microsoft.com/en-us/services/cosmos-db"
      },
      "Open data explorer",
      () => {
        window.open("https://cosmos.azure.com");
      },
      "Create Cosmos DB account",
      () => {
        window.open("https://ms.portal.azure.com/#create/Microsoft.DocumentDB");
      }
    );
  }
}

export async function favoriteItem(
  container: ViewModels.Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void
): Promise<void> {
  if (container) {
    try {
      const response = await junoClient.favoriteNotebook(data.id);
      if (!response.data) {
        throw new Error(`Received HTTP ${response.status} when favoriting ${data.name}`);
      }

      onComplete(response.data.notebook);
    } catch (error) {
      const message = `Failed to favorite ${data.name}: ${error}`;
      Logger.logError(message, "GalleryUtils/favoriteItem");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
    }
  }
}

export async function unfavoriteItem(
  container: ViewModels.Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void
): Promise<void> {
  if (container) {
    try {
      const response = await junoClient.unfavoriteNotebook(data.id);
      if (!response.data) {
        throw new Error(`Received HTTP ${response.status} when unfavoriting ${data.name}`);
      }

      onComplete(response.data.notebook);
    } catch (error) {
      const message = `Failed to unfavorite ${data.name}: ${error}`;
      Logger.logError(message, "GalleryUtils/unfavoriteItem");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
    }
  }
}

export function deleteItem(
  container: ViewModels.Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void
): void {
  if (container) {
    container.showOkCancelModalDialog(
      "Remove published notebook",
      `Would you like to remove ${data.name} from the gallery?`,
      "Remove",
      async () => {
        const name = data.name;
        const notificationId = NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.InProgress,
          `Removing ${name} from gallery`
        );

        try {
          const response = await junoClient.deleteNotebook(data.id);
          if (!response.data) {
            throw new Error(`Received HTTP ${response.status} while removing ${name}`);
          }

          NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, `Successfully removed ${name} from gallery`);
          onComplete(response.data.notebook);
        } catch (error) {
          const message = `Failed to remove ${name} from gallery: ${error}`;
          Logger.logError(message, "GalleryUtils/deleteItem");
          NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
        }

        NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
      },
      "Cancel",
      undefined
    );
  }
}

export function getGalleryViewerProps(window: Window & typeof globalThis): GalleryViewerProps {
  const params = new URLSearchParams(window.location.search);
  let selectedTab: GalleryTab;
  if (params.has(GalleryViewerParams.SelectedTab)) {
    selectedTab = GalleryTab[params.get(GalleryViewerParams.SelectedTab) as keyof typeof GalleryTab];
  }

  let sortBy: SortBy;
  if (params.has(GalleryViewerParams.SortBy)) {
    sortBy = SortBy[params.get(GalleryViewerParams.SortBy) as keyof typeof SortBy];
  }

  return {
    selectedTab,
    sortBy,
    searchText: params.get(GalleryViewerParams.SearchText)
  };
}

export function getNotebookViewerProps(window: Window & typeof globalThis): NotebookViewerProps {
  const params = new URLSearchParams(window.location.search);
  return {
    notebookUrl: params.get(NotebookViewerParams.NotebookUrl),
    galleryItemId: params.get(NotebookViewerParams.GalleryItemId)
  };
}

export function getTabTitle(tab: GalleryTab): string {
  switch (tab) {
    case GalleryTab.OfficialSamples:
      return GalleryViewerComponent.OfficialSamplesTitle;
    case GalleryTab.PublicGallery:
      return GalleryViewerComponent.PublicGalleryTitle;
    case GalleryTab.Favorites:
      return GalleryViewerComponent.FavoritesTitle;
    case GalleryTab.Published:
      return GalleryViewerComponent.PublishedTitle;
    default:
      throw new Error(`Unknown tab ${tab}`);
  }
}
