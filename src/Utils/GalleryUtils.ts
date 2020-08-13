import { IGalleryItem, JunoClient } from "../Juno/JunoClient";
import * as NotificationConsoleUtils from "./NotificationConsoleUtils";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import * as Logger from "../Common/Logger";
import {
  GalleryTab,
  SortBy,
  GalleryViewerComponent
} from "../Explorer/Controls/NotebookGallery/GalleryViewerComponent";
import Explorer from "../Explorer/Explorer";

export enum NotebookViewerParams {
  NotebookUrl = "notebookUrl",
  GalleryItemId = "galleryItemId",
  HideInputs = "hideInputs"
}

export interface NotebookViewerProps {
  notebookUrl: string;
  galleryItemId: string;
  hideInputs: boolean;
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

export function downloadItem(
  container: Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void
): void {
  const name = data.name;
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

        await container.importAndOpenContent(data.name, response.data);
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully downloaded ${name} to My Notebooks`
        );

        const increaseDownloadResponse = await junoClient.increaseNotebookDownloadCount(data.id);
        if (increaseDownloadResponse.data) {
          onComplete(increaseDownloadResponse.data);
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
}

export async function favoriteItem(
  container: Explorer,
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

      onComplete(response.data);
    } catch (error) {
      const message = `Failed to favorite ${data.name}: ${error}`;
      Logger.logError(message, "GalleryUtils/favoriteItem");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
    }
  }
}

export async function unfavoriteItem(
  container: Explorer,
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

      onComplete(response.data);
    } catch (error) {
      const message = `Failed to unfavorite ${data.name}: ${error}`;
      Logger.logError(message, "GalleryUtils/unfavoriteItem");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
    }
  }
}

export function deleteItem(
  container: Explorer,
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
          onComplete(response.data);
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

export function getGalleryViewerProps(search: string): GalleryViewerProps {
  const params = new URLSearchParams(search);
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

export function getNotebookViewerProps(search: string): NotebookViewerProps {
  const params = new URLSearchParams(search);
  return {
    notebookUrl: params.get(NotebookViewerParams.NotebookUrl),
    galleryItemId: params.get(NotebookViewerParams.GalleryItemId),
    hideInputs: JSON.parse(params.get(NotebookViewerParams.HideInputs))
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
