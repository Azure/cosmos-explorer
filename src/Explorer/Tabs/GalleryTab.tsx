import * as ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as ViewModels from "../../Contracts/ViewModels";
import { IGalleryItem, JunoClient } from "../../Juno/JunoClient";
import * as GalleryUtils from "../../Utils/GalleryUtils";
import {
  GalleryTab as GalleryViewerTab,
  GalleryViewerComponent,
  GalleryViewerComponentProps,
  SortBy
} from "../Controls/NotebookGallery/GalleryViewerComponent";
import {
  NotebookViewerComponent,
  NotebookViewerComponentProps
} from "../Controls/NotebookViewer/NotebookViewerComponent";
import TabsBase from "./TabsBase";

/**
 * Notebook gallery tab
 */
interface GalleryComponentAdapterProps {
  container: ViewModels.Explorer;
  junoClient: JunoClient;
  notebookUrl: string;
  galleryItem: IGalleryItem;
  isFavorite: boolean;
  selectedTab: GalleryViewerTab;
  sortBy: SortBy;
  searchText: string;
}

interface GalleryComponentAdapterState {
  notebookUrl: string;
  galleryItem: IGalleryItem;
  isFavorite: boolean;
  selectedTab: GalleryViewerTab;
  sortBy: SortBy;
  searchText: string;
}

class GalleryComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;
  private state: GalleryComponentAdapterState;

  constructor(private props: GalleryComponentAdapterProps) {
    this.parameters = ko.observable<number>(Date.now());
    this.state = {
      notebookUrl: props.notebookUrl,
      galleryItem: props.galleryItem,
      isFavorite: props.isFavorite,
      selectedTab: props.selectedTab,
      sortBy: props.sortBy,
      searchText: props.searchText
    };
  }

  public renderComponent(): JSX.Element {
    if (this.state.notebookUrl) {
      const props: NotebookViewerComponentProps = {
        container: this.props.container,
        junoClient: this.props.junoClient,
        notebookUrl: this.state.notebookUrl,
        galleryItem: this.state.galleryItem,
        isFavorite: this.state.isFavorite,
        backNavigationText: GalleryUtils.getTabTitle(this.state.selectedTab),
        onBackClick: this.onBackClick,
        onTagClick: this.loadTaggedItems
      };

      return <NotebookViewerComponent {...props} />;
    }

    const props: GalleryViewerComponentProps = {
      container: this.props.container,
      junoClient: this.props.junoClient,
      selectedTab: this.state.selectedTab,
      sortBy: this.state.sortBy,
      searchText: this.state.searchText,
      onSelectedTabChange: this.onSelectedTabChange,
      onSortByChange: this.onSortByChange,
      onSearchTextChange: this.onSearchTextChange
    };

    return <GalleryViewerComponent {...props} />;
  }

  public setState(state: Partial<GalleryComponentAdapterState>): void {
    this.state = Object.assign(this.state, state);
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }

  private onBackClick = (): void => {
    this.props.container.openGallery();
  };

  private loadTaggedItems = (tag: string): void => {
    this.setState({
      notebookUrl: undefined,
      searchText: tag
    });
  };

  private onSelectedTabChange = (selectedTab: GalleryViewerTab): void => {
    this.state.selectedTab = selectedTab;
  };

  private onSortByChange = (sortBy: SortBy): void => {
    this.state.sortBy = sortBy;
  };

  private onSearchTextChange = (searchText: string): void => {
    this.state.searchText = searchText;
  };
}

export default class GalleryTab extends TabsBase implements ViewModels.Tab {
  private container: ViewModels.Explorer;
  private galleryComponentAdapterProps: GalleryComponentAdapterProps;
  private galleryComponentAdapter: GalleryComponentAdapter;

  constructor(options: ViewModels.GalleryTabOptions) {
    super(options);

    this.container = options.container;
    this.galleryComponentAdapterProps = {
      container: options.container,
      junoClient: options.junoClient,
      notebookUrl: options.notebookUrl,
      galleryItem: options.galleryItem,
      isFavorite: options.isFavorite,
      selectedTab: GalleryViewerTab.OfficialSamples,
      sortBy: SortBy.MostViewed,
      searchText: undefined
    };

    this.galleryComponentAdapter = new GalleryComponentAdapter(this.galleryComponentAdapterProps);
  }

  protected getContainer(): ViewModels.Explorer {
    return this.container;
  }

  public updateGalleryParams(notebookUrl?: string, galleryItem?: IGalleryItem, isFavorite?: boolean): void {
    this.galleryComponentAdapter.setState({
      notebookUrl,
      galleryItem,
      isFavorite
    });
  }
}
