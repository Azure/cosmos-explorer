import * as ViewModels from "../../Contracts/ViewModels";
import { GalleryAndNotebookViewerComponentProps } from "../Controls/NotebookGallery/GalleryAndNotebookViewerComponent";
import { GalleryAndNotebookViewerComponentAdapter } from "../Controls/NotebookGallery/GalleryAndNotebookViewerComponentAdapter";
import { GalleryTab as GalleryViewerTab, SortBy } from "../Controls/NotebookGallery/GalleryViewerComponent";
import TabsBase from "./TabsBase";
import Explorer from "../Explorer";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { JunoClient, IGalleryItem } from "../../Juno/JunoClient";

interface GalleryTabOptions extends ViewModels.TabOptions {
  account: DatabaseAccount;
  container: Explorer;
  junoClient: JunoClient;
  notebookUrl?: string;
  galleryItem?: IGalleryItem;
  isFavorite?: boolean;
}

/**
 * Notebook gallery tab
 */
export default class GalleryTab extends TabsBase {
  private container: Explorer;
  public galleryAndNotebookViewerComponentAdapter: GalleryAndNotebookViewerComponentAdapter;

  constructor(options: GalleryTabOptions) {
    super(options);

    this.container = options.container;
    const props: GalleryAndNotebookViewerComponentProps = {
      container: options.container,
      junoClient: options.junoClient,
      notebookUrl: options.notebookUrl,
      galleryItem: options.galleryItem,
      isFavorite: options.isFavorite,
      selectedTab: GalleryViewerTab.OfficialSamples,
      sortBy: SortBy.MostViewed,
      searchText: undefined
    };

    this.galleryAndNotebookViewerComponentAdapter = new GalleryAndNotebookViewerComponentAdapter(props);
  }

  protected getContainer(): Explorer {
    return this.container;
  }
}
