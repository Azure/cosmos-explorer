import { IChoiceGroupOption, IChoiceGroupProps, IProgressIndicatorProps } from "@fluentui/react";
import { Notebook } from "@nteract/commutable";
import { NotebookV4 } from "@nteract/commutable/lib/v4";
import { HttpStatusCodes, PoolIdType } from "../Common/Constants";
import { getErrorMessage, getErrorStack, handleError } from "../Common/ErrorHandlingUtils";
import { TextFieldProps, useDialog } from "../Explorer/Controls/Dialog";
import {
  GalleryTab,
  GalleryViewerComponent,
  SortBy,
} from "../Explorer/Controls/NotebookGallery/GalleryViewerComponent";
import Explorer from "../Explorer/Explorer";
import { useNotebook } from "../Explorer/Notebook/useNotebook";
import { IGalleryItem, JunoClient } from "../Juno/JunoClient";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import { trace, traceFailure, traceStart, traceSuccess } from "../Shared/Telemetry/TelemetryProcessor";
import { logConsoleInfo, logConsoleProgress } from "./NotificationConsoleUtils";

const defaultSelectedAbuseCategory = "Other";
const abuseCategories: IChoiceGroupOption[] = [
  {
    key: "ChildEndangermentExploitation",
    text: "Child endangerment or exploitation",
  },
  {
    key: "ContentInfringement",
    text: "Content infringement",
  },
  {
    key: "OffensiveContent",
    text: "Offensive content",
  },
  {
    key: "Terrorism",
    text: "Terrorism",
  },
  {
    key: "ThreatsCyberbullyingHarassment",
    text: "Threats, cyber bullying or harassment",
  },
  {
    key: "VirusSpywareMalware",
    text: "Virus, spyware or malware",
  },
  {
    key: "Fraud",
    text: "Fraud",
  },
  {
    key: "HateSpeech",
    text: "Hate speech",
  },
  {
    key: "ImminentHarmToPersonsOrProperty",
    text: "Imminent harm to persons or property",
  },
  {
    key: "Other",
    text: "Other",
  },
];

export enum NotebookViewerParams {
  NotebookUrl = "notebookUrl",
  GalleryItemId = "galleryItemId",
  HideInputs = "hideInputs",
}

export interface NotebookViewerProps {
  notebookUrl: string;
  galleryItemId: string;
  hideInputs: boolean;
}

export enum GalleryViewerParams {
  SelectedTab = "tab",
  SortBy = "sort",
  SearchText = "q",
}

export interface GalleryViewerProps {
  selectedTab: GalleryTab;
  sortBy: SortBy;
  searchText: string;
}

export interface DialogHost {
  showOkModalDialog(
    title: string,
    msg: string,
    okLabel: string,
    onOk: () => void,
    progressIndicatorProps?: IProgressIndicatorProps,
  ): void;

  showOkCancelModalDialog(
    title: string,
    msg: string,
    okLabel: string,
    onOk: () => void,
    cancelLabel: string,
    onCancel: () => void,
    progressIndicatorProps?: IProgressIndicatorProps,
    choiceGroupProps?: IChoiceGroupProps,
    textFieldProps?: TextFieldProps,
    primaryButtonDisabled?: boolean,
  ): void;
}

export function reportAbuse(
  junoClient: JunoClient,
  data: IGalleryItem,
  dialogHost: DialogHost,
  onComplete: (success: boolean) => void,
): void {
  trace(Action.NotebooksGalleryClickReportAbuse, ActionModifiers.Mark, { notebookId: data.id });

  const notebookId = data.id;
  let abuseCategory = defaultSelectedAbuseCategory;
  let additionalDetails: string;

  dialogHost.showOkCancelModalDialog(
    "Report Abuse",
    undefined,
    "Report Abuse",
    async () => {
      dialogHost.showOkCancelModalDialog(
        "Report Abuse",
        `Submitting your report on ${data.name} violating code of conduct`,
        "Reporting...",
        undefined,
        "Cancel",
        undefined,
        {},
        undefined,
        undefined,
        true,
      );

      const startKey = traceStart(Action.NotebooksGalleryReportAbuse, { notebookId: data.id, abuseCategory });

      try {
        const response = await junoClient.reportAbuse(notebookId, abuseCategory, additionalDetails);
        if (response.status !== HttpStatusCodes.Accepted) {
          throw new Error(`Received HTTP ${response.status} when submitting report for ${data.name}`);
        }

        dialogHost.showOkModalDialog(
          "Report Abuse",
          `Your report on ${data.name} has been submitted. Thank you for reporting the violation.`,
          "OK",
          undefined,
          {
            percentComplete: 1,
          },
        );

        traceSuccess(Action.NotebooksGalleryReportAbuse, { notebookId: data.id, abuseCategory }, startKey);

        onComplete(response.data);
      } catch (error) {
        traceFailure(
          Action.NotebooksGalleryReportAbuse,
          {
            notebookId: data.id,
            abuseCategory,
            error: getErrorMessage(error),
            errorStack: getErrorStack(error),
          },
          startKey,
        );

        handleError(
          error,
          "GalleryUtils/reportAbuse",
          `Failed to submit report on ${data.name} violating code of conduct`,
        );

        dialogHost.showOkModalDialog(
          "Report Abuse",
          `Failed to submit report on ${data.name} violating code of conduct`,
          "OK",
          undefined,
          {
            percentComplete: 1,
          },
        );
      }
    },
    "Cancel",
    undefined,
    undefined,
    {
      label: "How does this content violate the code of conduct?",
      options: abuseCategories,
      defaultSelectedKey: defaultSelectedAbuseCategory,
      onChange: (_event?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption) => {
        abuseCategory = option?.key;
      },
    },
    {
      label: "You can also include additional relevant details on the offensive content",
      multiline: true,
      rows: 3,
      autoAdjustHeight: false,
      onChange: (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        additionalDetails = newValue;
      },
    },
  );
}

export function downloadItem(
  container: Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void,
): void {
  trace(Action.NotebooksGalleryClickDownload, ActionModifiers.Mark, {
    notebookId: data.id,
    downloadCount: data.downloads,
    isSample: data.isSample,
  });

  const name = data.name;
  useDialog.getState().showOkCancelModalDialog(
    `Download to ${useNotebook.getState().notebookFolderName}`,
    undefined,
    "Download",
    async () => {
      if (useNotebook.getState().isPhoenixNotebooks) {
        await container.allocateContainer(PoolIdType.DefaultPoolId);
      }
      const notebookServerInfo = useNotebook.getState().notebookServerInfo;
      if (notebookServerInfo && notebookServerInfo.notebookServerEndpoint !== undefined) {
        downloadNotebookItem(name, data, junoClient, container, onComplete);
      } else {
        useDialog
          .getState()
          .showOkModalDialog(
            "Failed to connect",
            "Failed to connect to temporary workspace. Please refresh the page and try again.",
          );
      }
    },
    "Cancel",
    undefined,
    container.getDownloadModalContent(name),
  );
}
export async function downloadNotebookItem(
  fileName: string,
  data: IGalleryItem,
  junoClient: JunoClient,
  container: Explorer,
  onComplete: (item: IGalleryItem) => void,
) {
  const clearInProgressMessage = logConsoleProgress(
    `Downloading ${fileName} to ${useNotebook.getState().notebookFolderName}`,
  );
  const startKey = traceStart(Action.NotebooksGalleryDownload, {
    notebookId: data.id,
    downloadCount: data.downloads,
    isSample: data.isSample,
  });

  try {
    const response = await junoClient.getNotebookContent(data.id);
    if (!response.data) {
      throw new Error(`Received HTTP ${response.status} when fetching ${data.name}`);
    }

    const notebook = JSON.parse(response.data) as Notebook;
    removeNotebookViewerLink(notebook, data.newCellId);

    if (!data.isSample) {
      const metadata = notebook.metadata as { [name: string]: unknown };
      metadata.untrusted = true;
    }

    await container.importAndOpenContent(data.name, JSON.stringify(notebook));
    logConsoleInfo(`Successfully downloaded ${data.name} to ${useNotebook.getState().notebookFolderName}`);

    const increaseDownloadResponse = await junoClient.increaseNotebookDownloadCount(data.id);
    if (increaseDownloadResponse.data) {
      traceSuccess(
        Action.NotebooksGalleryDownload,
        { notebookId: data.id, downloadCount: increaseDownloadResponse.data.downloads, isSample: data.isSample },
        startKey,
      );
      onComplete(increaseDownloadResponse.data);
    }
  } catch (error) {
    traceFailure(
      Action.NotebooksGalleryDownload,
      {
        notebookId: data.id,
        downloadCount: data.downloads,
        isSample: data.isSample,
        error: getErrorMessage(error),
        errorStack: getErrorStack(error),
      },
      startKey,
    );

    handleError(error, "GalleryUtils/downloadItem", `Failed to download ${data.name}`);
  }

  clearInProgressMessage();
}
export const removeNotebookViewerLink = (notebook: Notebook, newCellId: string): void => {
  if (!newCellId) {
    return;
  }
  const notebookV4 = notebook as NotebookV4;
  if (notebookV4?.cells[0]?.source[0]?.search(newCellId)) {
    notebookV4.cells.splice(0, 1);
    notebook = notebookV4;
  }
};

export async function favoriteItem(
  container: Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void,
): Promise<void> {
  if (container) {
    const startKey = traceStart(Action.NotebooksGalleryFavorite, {
      notebookId: data.id,
      isSample: data.isSample,
      favoriteCount: data.favorites,
    });

    try {
      const response = await junoClient.favoriteNotebook(data.id);
      if (!response.data) {
        throw new Error(`Received HTTP ${response.status} when favoriting ${data.name}`);
      }

      traceSuccess(
        Action.NotebooksGalleryFavorite,
        { notebookId: data.id, isSample: data.isSample, favoriteCount: response.data.favorites },
        startKey,
      );

      onComplete(response.data);
    } catch (error) {
      traceFailure(
        Action.NotebooksGalleryFavorite,
        {
          notebookId: data.id,
          isSample: data.isSample,
          favoriteCount: data.favorites,
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey,
      );

      handleError(error, "GalleryUtils/favoriteItem", `Failed to favorite ${data.name}`);
    }
  }
}

export async function unfavoriteItem(
  container: Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void,
): Promise<void> {
  if (container) {
    const startKey = traceStart(Action.NotebooksGalleryUnfavorite, {
      notebookId: data.id,
      isSample: data.isSample,
      favoriteCount: data.favorites,
    });

    try {
      const response = await junoClient.unfavoriteNotebook(data.id);
      if (!response.data) {
        throw new Error(`Received HTTP ${response.status} when unfavoriting ${data.name}`);
      }

      traceSuccess(
        Action.NotebooksGalleryUnfavorite,
        { notebookId: data.id, isSample: data.isSample, favoriteCount: response.data.favorites },
        startKey,
      );

      onComplete(response.data);
    } catch (error) {
      traceFailure(
        Action.NotebooksGalleryUnfavorite,
        {
          notebookId: data.id,
          isSample: data.isSample,
          favoriteCount: data.favorites,
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey,
      );

      handleError(error, "GalleryUtils/unfavoriteItem", `Failed to unfavorite ${data.name}`);
    }
  }
}

export function deleteItem(
  container: Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void,
  beforeDelete?: () => void,
  afterDelete?: () => void,
): void {
  if (container) {
    trace(Action.NotebooksGalleryClickDelete, ActionModifiers.Mark, { notebookId: data.id });

    useDialog.getState().showOkCancelModalDialog(
      "Remove published notebook",
      `Would you like to remove ${data.name} from the gallery?`,
      "Remove",
      async () => {
        if (beforeDelete) {
          beforeDelete();
        }
        const name = data.name;
        const clearInProgressMessage = logConsoleProgress(`Removing ${name} from gallery`);
        const startKey = traceStart(Action.NotebooksGalleryDelete, { notebookId: data.id });

        try {
          const response = await junoClient.deleteNotebook(data.id);
          if (!response.data) {
            throw new Error(`Received HTTP ${response.status} while removing ${name}`);
          }

          traceSuccess(Action.NotebooksGalleryDelete, { notebookId: data.id }, startKey);

          logConsoleInfo(`Successfully removed ${name} from gallery`);
          onComplete(response.data);
        } catch (error) {
          traceFailure(
            Action.NotebooksGalleryDelete,
            { notebookId: data.id, error: getErrorMessage(error), errorStack: getErrorStack(error) },
            startKey,
          );

          handleError(error, "GalleryUtils/deleteItem", `Failed to remove ${name} from gallery`);
        } finally {
          if (afterDelete) {
            afterDelete();
          }
        }

        clearInProgressMessage();
      },
      "Cancel",
      undefined,
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
    searchText: params.get(GalleryViewerParams.SearchText),
  };
}

export function getNotebookViewerProps(search: string): NotebookViewerProps {
  const params = new URLSearchParams(search);
  return {
    notebookUrl: params.get(NotebookViewerParams.NotebookUrl),
    galleryItemId: params.get(NotebookViewerParams.GalleryItemId),
    hideInputs: JSON.parse(params.get(NotebookViewerParams.HideInputs)),
  };
}

export function getTabTitle(tab: GalleryTab): string {
  switch (tab) {
    case GalleryTab.PublicGallery:
      return GalleryViewerComponent.PublicGalleryTitle;
    case GalleryTab.OfficialSamples:
      return GalleryViewerComponent.OfficialSamplesTitle;
    case GalleryTab.Favorites:
      return GalleryViewerComponent.FavoritesTitle;
    case GalleryTab.Published:
      return GalleryViewerComponent.PublishedTitle;
    default:
      throw new Error(`Unknown tab ${tab}`);
  }
}

export function filterPublishedNotebooks(items: IGalleryItem[]): {
  published: IGalleryItem[];
  underReview: IGalleryItem[];
  removed: IGalleryItem[];
} {
  const underReview: IGalleryItem[] = [];
  const removed: IGalleryItem[] = [];
  const published: IGalleryItem[] = [];

  items?.forEach((item) => {
    if (item.policyViolations?.length > 0) {
      removed.push(item);
    } else if (item.pendingScanJobIds?.length > 0) {
      underReview.push(item);
    } else {
      published.push(item);
    }
  });

  return { published, underReview, removed };
}
