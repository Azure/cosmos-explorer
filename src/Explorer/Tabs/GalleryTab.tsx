import * as ViewModels from "../../Contracts/ViewModels";
import { GalleryAndNotebookViewerComponentProps } from "../Controls/NotebookGallery/GalleryAndNotebookViewerComponent";
import { GalleryAndNotebookViewerComponentAdapter } from "../Controls/NotebookGallery/GalleryAndNotebookViewerComponentAdapter";
import { GalleryTab as GalleryViewerTab, SortBy } from "../Controls/NotebookGallery/GalleryViewerComponent";
import TabsBase from "./TabsBase";

/**
 * Notebook gallery tab
 */
export default class GalleryTab extends TabsBase implements ViewModels.Tab {
  private container: ViewModels.Explorer;
  public galleryAndNotebookViewerComponentAdapter: GalleryAndNotebookViewerComponentAdapter;

  constructor(options: ViewModels.GalleryTabOptions) {
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

  protected getContainer(): ViewModels.Explorer {
    return this.container;
  }
}
