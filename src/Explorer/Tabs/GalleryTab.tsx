import { DatabaseAccount } from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { IGalleryItem, JunoClient } from "../../Juno/JunoClient";
import { GalleryAndNotebookViewerComponentProps } from "../Controls/NotebookGallery/GalleryAndNotebookViewerComponent";
import { GalleryAndNotebookViewerComponentAdapter } from "../Controls/NotebookGallery/GalleryAndNotebookViewerComponentAdapter";
import { GalleryTab as GalleryViewerTab, SortBy } from "../Controls/NotebookGallery/GalleryViewerComponent";
import Explorer from "../Explorer";
import TabsBase from "./TabsBase";

interface GalleryTabOptions extends ViewModels.TabOptions {
  account: DatabaseAccount;
  container: Explorer;
  junoClient: JunoClient;
  selectedTab: GalleryViewerTab;
  notebookUrl?: string;
  galleryItem?: IGalleryItem;
  isFavorite?: boolean;
}

/**
 * Notebook gallery tab
 */
export default class GalleryTab extends TabsBase {
  public readonly html = '<div style="height: 100%" data-bind="react:galleryAndNotebookViewerComponentAdapter"></div>';
  private container: Explorer;
  private galleryAndNotebookViewerComponentProps: GalleryAndNotebookViewerComponentProps;
  public galleryAndNotebookViewerComponentAdapter: GalleryAndNotebookViewerComponentAdapter;

  constructor(options: GalleryTabOptions) {
    super(options);
    this.container = options.container;

    this.galleryAndNotebookViewerComponentProps = {
      container: options.container,
      junoClient: options.junoClient,
      notebookUrl: options.notebookUrl,
      galleryItem: options.galleryItem,
      isFavorite: options.isFavorite,
      selectedTab: options.selectedTab,
      sortBy: SortBy.MostRecent,
      searchText: undefined,
    };
    this.galleryAndNotebookViewerComponentAdapter = new GalleryAndNotebookViewerComponentAdapter(
      this.galleryAndNotebookViewerComponentProps
    );
  }

  public reset(options: GalleryTabOptions) {
    this.container = options.container;

    this.galleryAndNotebookViewerComponentProps.container = options.container;
    this.galleryAndNotebookViewerComponentProps.junoClient = options.junoClient;
    this.galleryAndNotebookViewerComponentProps.notebookUrl = options.notebookUrl;
    this.galleryAndNotebookViewerComponentProps.galleryItem = options.galleryItem;
    this.galleryAndNotebookViewerComponentProps.isFavorite = options.isFavorite;
    this.galleryAndNotebookViewerComponentProps.selectedTab = options.selectedTab;
    this.galleryAndNotebookViewerComponentProps.sortBy = SortBy.MostViewed;
    this.galleryAndNotebookViewerComponentProps.searchText = undefined;

    this.galleryAndNotebookViewerComponentAdapter.reset();
    this.galleryAndNotebookViewerComponentAdapter.triggerRender();
  }

  public getContainer(): Explorer {
    return this.container;
  }
}
