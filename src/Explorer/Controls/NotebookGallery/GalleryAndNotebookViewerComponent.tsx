import * as React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { JunoClient, IGalleryItem } from "../../../Juno/JunoClient";
import { GalleryTab, SortBy, GalleryViewerComponentProps, GalleryViewerComponent } from "./GalleryViewerComponent";
import { NotebookViewerComponentProps, NotebookViewerComponent } from "../NotebookViewer/NotebookViewerComponent";
import * as GalleryUtils from "../../../Utils/GalleryUtils";

export interface GalleryAndNotebookViewerComponentProps {
  container?: ViewModels.Explorer;
  junoClient: JunoClient;
  notebookUrl?: string;
  galleryItem?: IGalleryItem;
  isFavorite?: boolean;
  selectedTab: GalleryTab;
  sortBy: SortBy;
  searchText: string;
}

interface GalleryAndNotebookViewerComponentState {
  notebookUrl: string;
  galleryItem: IGalleryItem;
  isFavorite: boolean;
  selectedTab: GalleryTab;
  sortBy: SortBy;
  searchText: string;
}

export class GalleryAndNotebookViewerComponent extends React.Component<
  GalleryAndNotebookViewerComponentProps,
  GalleryAndNotebookViewerComponentState
> {
  constructor(props: GalleryAndNotebookViewerComponentProps) {
    super(props);

    this.state = {
      notebookUrl: props.notebookUrl,
      galleryItem: props.galleryItem,
      isFavorite: props.isFavorite,
      selectedTab: props.selectedTab,
      sortBy: props.sortBy,
      searchText: props.searchText
    };
  }

  public render(): JSX.Element {
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
      openNotebook: this.openNotebook,
      onSelectedTabChange: this.onSelectedTabChange,
      onSortByChange: this.onSortByChange,
      onSearchTextChange: this.onSearchTextChange
    };

    return <GalleryViewerComponent {...props} />;
  }

  private onBackClick = (): void => {
    this.setState({
      notebookUrl: undefined
    });
  };

  private loadTaggedItems = (tag: string): void => {
    this.setState({
      notebookUrl: undefined,
      searchText: tag
    });
  };

  private openNotebook = (data: IGalleryItem, isFavorite: boolean): void => {
    this.setState({
      notebookUrl: this.props.junoClient.getNotebookContentUrl(data.id),
      galleryItem: data,
      isFavorite
    });
  };

  private onSelectedTabChange = (selectedTab: GalleryTab): void => {
    this.setState({
      selectedTab
    });
  };

  private onSortByChange = (sortBy: SortBy): void => {
    this.setState({
      sortBy
    });
  };

  private onSearchTextChange = (searchText: string): void => {
    this.setState({
      searchText
    });
  };
}
