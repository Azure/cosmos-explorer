import {
  Dropdown,
  FocusZone,
  FontIcon,
  FontWeights,
  IDropdownOption,
  IPageSpecification,
  IPivotItemProps,
  IPivotProps,
  IRectangle,
  Label,
  Link,
  List,
  Overlay,
  Pivot,
  PivotItem,
  SearchBox,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
} from "@fluentui/react";
import * as React from "react";
import { HttpStatusCodes } from "../../../Common/Constants";
import { handleError } from "../../../Common/ErrorHandlingUtils";
import { IGalleryItem, IJunoResponse, IPublicGalleryData, JunoClient } from "../../../Juno/JunoClient";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import { trace } from "../../../Shared/Telemetry/TelemetryProcessor";
import * as GalleryUtils from "../../../Utils/GalleryUtils";
import Explorer from "../../Explorer";
import { Dialog, DialogProps } from "../Dialog";
import { GalleryCardComponent, GalleryCardComponentProps } from "./Cards/GalleryCardComponent";
import { CodeOfConductComponent } from "./CodeOfConductComponent";
import "./GalleryViewerComponent.less";
import { InfoComponent } from "./InfoComponent/InfoComponent";

export interface GalleryViewerComponentProps {
  container?: Explorer;
  junoClient: JunoClient;
  selectedTab: GalleryTab;
  sortBy: SortBy;
  searchText: string;
  openNotebook: (data: IGalleryItem, isFavorite: boolean) => void;
  onSelectedTabChange: (newTab: GalleryTab) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onSearchTextChange: (searchText: string) => void;
}

export enum GalleryTab {
  PublicGallery,
  OfficialSamples,
  Favorites,
  Published,
}

export enum SortBy {
  MostViewed,
  MostDownloaded,
  MostFavorited,
  MostRecent,
}

interface GalleryViewerComponentState {
  sampleNotebooks: IGalleryItem[];
  publicNotebooks: IGalleryItem[];
  favoriteNotebooks: IGalleryItem[];
  publishedNotebooks: IGalleryItem[];
  selectedTab: GalleryTab;
  sortBy: SortBy;
  searchText: string;
  dialogProps: DialogProps;
  isCodeOfConductAccepted: boolean;
  isFetchingPublishedNotebooks: boolean;
  isFetchingFavouriteNotebooks: boolean;
}

interface GalleryTabInfo {
  tab: GalleryTab;
  content: JSX.Element;
}

export class GalleryViewerComponent extends React.Component<GalleryViewerComponentProps, GalleryViewerComponentState> {
  public static readonly OfficialSamplesTitle = "Official samples";
  public static readonly PublicGalleryTitle = "Public gallery";
  public static readonly FavoritesTitle = "My favorites";
  public static readonly PublishedTitle = "My published work";

  private static readonly rowsPerPage = 5;
  private static readonly CARD_WIDTH = 256;
  private static readonly mostViewedText = "Most viewed";
  private static readonly mostDownloadedText = "Most downloaded";
  private static readonly mostFavoritedText = "Most favorited";
  private static readonly mostRecentText = "Most recent";

  private readonly sortingOptions: IDropdownOption[];

  private viewGalleryTraced: boolean;
  private viewOfficialSamplesTraced: boolean;
  private viewPublicGalleryTraced: boolean;
  private viewFavoritesTraced: boolean;
  private viewPublishedNotebooksTraced: boolean;

  private sampleNotebooks: IGalleryItem[];
  private publicNotebooks: IGalleryItem[];
  private favoriteNotebooks: IGalleryItem[];
  private publishedNotebooks: IGalleryItem[];
  private isCodeOfConductAccepted: boolean;
  private columnCount: number;
  private rowCount: number;

  constructor(props: GalleryViewerComponentProps) {
    super(props);

    this.state = {
      sampleNotebooks: undefined,
      publicNotebooks: undefined,
      favoriteNotebooks: undefined,
      publishedNotebooks: undefined,
      selectedTab: props.selectedTab,
      sortBy: props.sortBy,
      searchText: props.searchText,
      dialogProps: undefined,
      isCodeOfConductAccepted: undefined,
      isFetchingFavouriteNotebooks: true,
      isFetchingPublishedNotebooks: true,
    };

    this.sortingOptions = [
      {
        key: SortBy.MostViewed,
        text: GalleryViewerComponent.mostViewedText,
      },
      {
        key: SortBy.MostDownloaded,
        text: GalleryViewerComponent.mostDownloadedText,
      },
      {
        key: SortBy.MostRecent,
        text: GalleryViewerComponent.mostRecentText,
      },
      {
        key: SortBy.MostFavorited,
        text: GalleryViewerComponent.mostFavoritedText,
      },
    ];

    this.loadTabContent(this.state.selectedTab, this.state.searchText, this.state.sortBy, false);
    this.loadFavoriteNotebooks(this.state.searchText, this.state.sortBy, false); // Need this to show correct favorite button state
  }

  public render(): JSX.Element {
    this.traceViewGallery();

    const tabs: GalleryTabInfo[] = [
      this.createPublicGalleryTab(
        GalleryTab.PublicGallery,
        this.state.publicNotebooks,
        this.state.isCodeOfConductAccepted
      ),
      this.createSamplesTab(GalleryTab.OfficialSamples, this.state.sampleNotebooks),
    ];

    if (this.props.container) {
      tabs.push(this.createFavoritesTab(GalleryTab.Favorites, this.state.favoriteNotebooks));
      tabs.push(this.createPublishedNotebooksTab(GalleryTab.Published, this.state.publishedNotebooks));
    }

    const pivotProps: IPivotProps = {
      onLinkClick: this.onPivotChange,
      selectedKey: GalleryTab[this.state.selectedTab],
    };

    const pivotItems = tabs.map((tab) => {
      const pivotItemProps: IPivotItemProps = {
        itemKey: GalleryTab[tab.tab],
        style: { marginTop: 20 },
        headerText: GalleryUtils.getTabTitle(tab.tab),
      };

      return (
        <PivotItem key={pivotItemProps.itemKey} {...pivotItemProps}>
          {tab.content}
        </PivotItem>
      );
    });

    return (
      <div className="galleryContainer">
        <Pivot {...pivotProps}>{pivotItems}</Pivot>

        {this.state.dialogProps && <Dialog {...this.state.dialogProps} />}
      </div>
    );
  }

  private traceViewGallery = (): void => {
    if (!this.viewGalleryTraced) {
      this.viewGalleryTraced = true;
      trace(Action.NotebooksGalleryViewGallery);
    }

    switch (this.state.selectedTab) {
      case GalleryTab.PublicGallery:
        if (!this.viewPublicGalleryTraced) {
          this.resetViewGalleryTabTracedFlags();
          this.viewPublicGalleryTraced = true;
          trace(Action.NotebooksGalleryViewPublicGallery);
        }
        break;
      case GalleryTab.OfficialSamples:
        if (!this.viewOfficialSamplesTraced) {
          this.resetViewGalleryTabTracedFlags();
          this.viewOfficialSamplesTraced = true;
          trace(Action.NotebooksGalleryViewOfficialSamples);
        }
        break;
      case GalleryTab.Favorites:
        if (!this.viewFavoritesTraced) {
          this.resetViewGalleryTabTracedFlags();
          this.viewFavoritesTraced = true;
          trace(Action.NotebooksGalleryViewFavorites);
        }
        break;
      case GalleryTab.Published:
        if (!this.viewPublishedNotebooksTraced) {
          this.resetViewGalleryTabTracedFlags();
          this.viewPublishedNotebooksTraced = true;
          trace(Action.NotebooksGalleryViewPublishedNotebooks);
        }
        break;
      default:
        throw new Error(`Unknown selected tab ${this.state.selectedTab}`);
    }
  };

  private resetViewGalleryTabTracedFlags = (): void => {
    this.viewOfficialSamplesTraced = false;
    this.viewPublicGalleryTraced = false;
    this.viewFavoritesTraced = false;
    this.viewPublishedNotebooksTraced = false;
  };

  private isEmptyData = (data: IGalleryItem[]): boolean => {
    return !data || data.length === 0;
  };

  private createEmptyTabContent = (iconName: string, line1: JSX.Element, line2: JSX.Element): JSX.Element => {
    return (
      <Stack horizontalAlign="center" tokens={{ childrenGap: 10 }}>
        <FontIcon iconName={iconName} style={{ fontSize: 100, color: "lightgray", marginTop: 20 }} />
        <Text styles={{ root: { fontWeight: FontWeights.semibold } }}>{line1}</Text>
        <Text>{line2}</Text>
      </Stack>
    );
  };

  private createSamplesTab = (tab: GalleryTab, data: IGalleryItem[]): GalleryTabInfo => {
    return {
      tab,
      content: this.createSearchBarHeader(this.createCardsTabContent(data)),
    };
  };

  private createPublicGalleryTab(
    tab: GalleryTab,
    data: IGalleryItem[],
    acceptedCodeOfConduct: boolean
  ): GalleryTabInfo {
    return {
      tab,
      content: this.createPublicGalleryTabContent(data, acceptedCodeOfConduct),
    };
  }

  private getFavouriteNotebooksTabContent = (data: IGalleryItem[]) => {
    if (this.isEmptyData(data)) {
      if (this.state.isFetchingFavouriteNotebooks) {
        return <Spinner size={SpinnerSize.large} />;
      }
      return this.createEmptyTabContent(
        "ContactHeart",
        <>You don&apos;t have any favorites yet</>,
        <>
          Favorite any notebook from the{" "}
          <Link onClick={() => this.setState({ selectedTab: GalleryTab.OfficialSamples })}>official samples</Link> or{" "}
          <Link onClick={() => this.setState({ selectedTab: GalleryTab.PublicGallery })}>public gallery</Link>
        </>
      );
    }
    return this.createSearchBarHeader(this.createCardsTabContent(data));
  };

  private createFavoritesTab(tab: GalleryTab, data: IGalleryItem[]): GalleryTabInfo {
    return {
      tab,
      content: this.getFavouriteNotebooksTabContent(data),
    };
  }

  private getPublishedNotebooksTabContent = (data: IGalleryItem[]) => {
    if (this.isEmptyData(data)) {
      if (this.state.isFetchingPublishedNotebooks) {
        return <Spinner size={SpinnerSize.large} />;
      }
      return this.createEmptyTabContent(
        "Contact",
        <>
          You have not published anything to the{" "}
          <Link onClick={() => this.setState({ selectedTab: GalleryTab.PublicGallery })}>public gallery</Link> yet
        </>,
        <>Publish your notebooks to share your work with other users</>
      );
    }
    return this.createPublishedNotebooksTabContent(data);
  };

  private createPublishedNotebooksTab = (tab: GalleryTab, data: IGalleryItem[]): GalleryTabInfo => {
    return {
      tab,
      content: this.getPublishedNotebooksTabContent(data),
    };
  };

  private createPublishedNotebooksTabContent = (data: IGalleryItem[]): JSX.Element => {
    const { published, underReview, removed } = GalleryUtils.filterPublishedNotebooks(data);
    const content = (
      <Stack tokens={{ childrenGap: 20 }}>
        {published?.length > 0 &&
          this.createPublishedNotebooksSectionContent(
            undefined,
            "You have successfully published and shared the following notebook(s) to the public gallery.",
            this.createCardsTabContent(published)
          )}
        {underReview?.length > 0 &&
          this.createPublishedNotebooksSectionContent(
            "Under Review",
            "Content of a notebook you published is currently being scanned for illegal content. It will not be available to public gallery until the review is completed (may take a few days)",
            this.createCardsTabContent(underReview)
          )}
        {removed?.length > 0 &&
          this.createPublishedNotebooksSectionContent(
            "Removed",
            "These notebooks were found to contain illegal content and has been taken down.",
            this.createPolicyViolationsListContent(removed)
          )}
      </Stack>
    );

    return this.createSearchBarHeader(content);
  };

  private createPublishedNotebooksSectionContent = (
    title: string,
    description: string,
    content: JSX.Element
  ): JSX.Element => {
    return (
      <Stack tokens={{ childrenGap: 10 }}>
        {title && (
          <Text styles={{ root: { fontWeight: FontWeights.semibold, marginLeft: 10, marginRight: 10 } }}>{title}</Text>
        )}
        {description && <Text styles={{ root: { marginLeft: 10, marginRight: 10 } }}>{description}</Text>}
        {content}
      </Stack>
    );
  };

  private createPublicGalleryTabContent(data: IGalleryItem[], acceptedCodeOfConduct: boolean): JSX.Element {
    return (
      <div className="publicGalleryTabContainer">
        {this.createSearchBarHeader(this.createCardsTabContent(data))}
        {acceptedCodeOfConduct === false && (
          <Overlay isDarkThemed>
            <div className="publicGalleryTabOverlayContent">
              <CodeOfConductComponent
                junoClient={this.props.junoClient}
                onAcceptCodeOfConduct={(result: boolean) => {
                  this.setState({ isCodeOfConductAccepted: result });
                }}
              />
            </div>
          </Overlay>
        )}
      </div>
    );
  }

  private createSearchBarHeader(content: JSX.Element): JSX.Element {
    return (
      <Stack tokens={{ childrenGap: 10 }}>
        <Stack horizontal wrap tokens={{ childrenGap: 20, padding: 10 }}>
          <Stack.Item grow>
            <SearchBox value={this.state.searchText} placeholder="Search" onChange={this.onSearchBoxChange} />
          </Stack.Item>
          <Stack.Item>
            <Label>Sort by</Label>
          </Stack.Item>
          <Stack.Item styles={{ root: { minWidth: 200 } }}>
            <Dropdown options={this.sortingOptions} selectedKey={this.state.sortBy} onChange={this.onDropdownChange} />
          </Stack.Item>
          <Stack.Item>
            <InfoComponent />
          </Stack.Item>
        </Stack>
        <Stack.Item>{content}</Stack.Item>
      </Stack>
    );
  }

  private createCardsTabContent(data: IGalleryItem[]): JSX.Element {
    return data ? (
      <FocusZone>
        <List
          items={data}
          getPageSpecification={this.getPageSpecification}
          renderedWindowsAhead={3}
          onRenderCell={this.onRenderCell}
        />
      </FocusZone>
    ) : (
      <Spinner size={SpinnerSize.large} />
    );
  }

  private createPolicyViolationsListContent(data: IGalleryItem[]): JSX.Element {
    return (
      <table style={{ margin: 10 }}>
        <tbody>
          <tr>
            <th>Name</th>
            <th>Policy violations</th>
          </tr>
          {data.map((item) => (
            <tr key={`policy-violations-tr-${item.id}`}>
              <td>{item.name}</td>
              <td>{item.policyViolations.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  private loadTabContent(tab: GalleryTab, searchText: string, sortBy: SortBy, offline: boolean): void {
    switch (tab) {
      case GalleryTab.PublicGallery:
        this.loadPublicNotebooks(searchText, sortBy, offline);
        break;

      case GalleryTab.OfficialSamples:
        this.loadSampleNotebooks(searchText, sortBy, offline);
        break;

      case GalleryTab.Favorites:
        this.loadFavoriteNotebooks(searchText, sortBy, offline);
        break;

      case GalleryTab.Published:
        this.loadPublishedNotebooks(searchText, sortBy, offline);
        break;

      default:
        throw new Error(`Unknown tab ${tab}`);
    }
  }

  private async loadSampleNotebooks(searchText: string, sortBy: SortBy, offline: boolean): Promise<void> {
    if (!offline) {
      try {
        const response = await this.props.junoClient.getSampleNotebooks();
        if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
          throw new Error(`Received HTTP ${response.status} when loading sample notebooks`);
        }

        this.sampleNotebooks = response.data;

        trace(Action.NotebooksGalleryOfficialSamplesCount, ActionModifiers.Mark, {
          count: this.sampleNotebooks?.length,
        });
      } catch (error) {
        handleError(error, "GalleryViewerComponent/loadSampleNotebooks", "Failed to load sample notebooks");
      }
    }

    this.setState({
      sampleNotebooks: this.sampleNotebooks && [...this.sort(sortBy, this.search(searchText, this.sampleNotebooks))],
    });
  }

  private async loadPublicNotebooks(searchText: string, sortBy: SortBy, offline: boolean): Promise<void> {
    if (!offline) {
      try {
        let response: IJunoResponse<IGalleryItem[]> | IJunoResponse<IPublicGalleryData>;
        if (this.props.container) {
          response = await this.props.junoClient.getPublicGalleryData();
          this.isCodeOfConductAccepted = response.data?.metadata.acceptedCodeOfConduct;
          this.publicNotebooks = response.data?.notebooksData;
        } else {
          response = await this.props.junoClient.getPublicNotebooks();
          this.publicNotebooks = response.data;
        }

        if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
          throw new Error(`Received HTTP ${response.status} when loading public notebooks`);
        }

        trace(Action.NotebooksGalleryPublicGalleryCount, ActionModifiers.Mark, { count: this.publicNotebooks?.length });
      } catch (error) {
        handleError(error, "GalleryViewerComponent/loadPublicNotebooks", "Failed to load public notebooks");
      }
    }

    this.setState({
      publicNotebooks: this.publicNotebooks && [...this.sort(sortBy, this.search(searchText, this.publicNotebooks))],
      isCodeOfConductAccepted: this.isCodeOfConductAccepted,
    });
  }

  private async loadFavoriteNotebooks(searchText: string, sortBy: SortBy, offline: boolean): Promise<void> {
    if (!offline) {
      try {
        this.setState({ isFetchingFavouriteNotebooks: true });
        const response = await this.props.junoClient.getFavoriteNotebooks();
        if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
          throw new Error(`Received HTTP ${response.status} when loading favorite notebooks`);
        }

        this.favoriteNotebooks = response.data;

        trace(Action.NotebooksGalleryFavoritesCount, ActionModifiers.Mark, { count: this.favoriteNotebooks?.length });
      } catch (error) {
        handleError(error, "GalleryViewerComponent/loadFavoriteNotebooks", "Failed to load favorite notebooks");
      } finally {
        this.setState({ isFetchingFavouriteNotebooks: false });
      }
    }

    this.setState({
      favoriteNotebooks: this.favoriteNotebooks && [
        ...this.sort(sortBy, this.search(searchText, this.favoriteNotebooks)),
      ],
    });

    // Refresh favorite button state
    if (this.state.selectedTab !== GalleryTab.Favorites) {
      this.refreshSelectedTab();
    }
  }

  private async loadPublishedNotebooks(searchText: string, sortBy: SortBy, offline: boolean): Promise<void> {
    if (!offline) {
      try {
        this.setState({ isFetchingPublishedNotebooks: true });
        const response = await this.props.junoClient.getPublishedNotebooks();
        if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
          throw new Error(`Received HTTP ${response.status} when loading published notebooks`);
        }

        this.publishedNotebooks = response.data;

        const { published, underReview, removed } = GalleryUtils.filterPublishedNotebooks(this.publishedNotebooks);
        trace(Action.NotebooksGalleryPublishedCount, ActionModifiers.Mark, {
          count: this.publishedNotebooks?.length,
          publishedCount: published.length,
          underReviewCount: underReview.length,
          removedCount: removed.length,
        });
      } catch (error) {
        handleError(error, "GalleryViewerComponent/loadPublishedNotebooks", "Failed to load published notebooks");
      } finally {
        this.setState({ isFetchingPublishedNotebooks: false });
      }
    }

    this.setState({
      publishedNotebooks: this.publishedNotebooks && [
        ...this.sort(sortBy, this.search(searchText, this.publishedNotebooks)),
      ],
    });
  }

  private search(searchText: string, data: IGalleryItem[]): IGalleryItem[] {
    if (searchText) {
      return data?.filter((item) => this.isGalleryItemPresent(searchText, item));
    }

    return data;
  }

  private isGalleryItemPresent(searchText: string, item: IGalleryItem): boolean {
    const toSearch = searchText.trim().toUpperCase();
    const searchData: string[] = [item.author.toUpperCase(), item.description.toUpperCase(), item.name.toUpperCase()];

    if (item.tags) {
      searchData.push(...item.tags.map((tag) => tag.toUpperCase()));
    }

    for (const data of searchData) {
      if (data?.indexOf(toSearch) !== -1) {
        return true;
      }
    }
    return false;
  }

  private sort(sortBy: SortBy, data: IGalleryItem[]): IGalleryItem[] {
    return data?.sort((a, b) => {
      switch (sortBy) {
        case SortBy.MostViewed:
          return b.views - a.views;
        case SortBy.MostDownloaded:
          return b.downloads - a.downloads;
        case SortBy.MostFavorited:
          return b.favorites - a.favorites;
        case SortBy.MostRecent:
          return Date.parse(b.created) - Date.parse(a.created);
        default:
          throw new Error(`Unknown sorting condition ${sortBy}`);
      }
    });
  }

  private refreshSelectedTab(item?: IGalleryItem): void {
    if (item) {
      this.updateGalleryItem(item);
    }
    this.loadTabContent(this.state.selectedTab, this.state.searchText, this.state.sortBy, true);
  }

  private updateGalleryItem(updatedItem: IGalleryItem): void {
    this.replaceGalleryItem(updatedItem, this.sampleNotebooks);
    this.replaceGalleryItem(updatedItem, this.publicNotebooks);
    this.replaceGalleryItem(updatedItem, this.favoriteNotebooks);
    this.replaceGalleryItem(updatedItem, this.publishedNotebooks);
  }

  private replaceGalleryItem(item: IGalleryItem, items?: IGalleryItem[]): void {
    const index = items?.findIndex((value) => value.id === item.id);
    if (index !== -1) {
      items?.splice(index, 1, item);
    }
  }

  private getPageSpecification = (itemIndex?: number, visibleRect?: IRectangle): IPageSpecification => {
    if (itemIndex === 0) {
      this.columnCount = Math.floor(visibleRect.width / GalleryViewerComponent.CARD_WIDTH) || this.columnCount;
      this.rowCount = GalleryViewerComponent.rowsPerPage;
    }

    return {
      height: visibleRect.height,
      itemCount: this.columnCount * this.rowCount,
    };
  };

  private onRenderCell = (data?: IGalleryItem): JSX.Element => {
    const isFavorite =
      this.props.container && this.favoriteNotebooks?.find((item) => item.id === data.id) !== undefined;
    const props: GalleryCardComponentProps = {
      data,
      isFavorite,
      showDownload: !!this.props.container,
      showDelete: this.state.selectedTab === GalleryTab.Published,
      onClick: () => this.props.openNotebook(data, isFavorite),
      onTagClick: this.loadTaggedItems,
      onFavoriteClick: () => this.favoriteItem(data),
      onUnfavoriteClick: () => this.unfavoriteItem(data),
      onDownloadClick: () => this.downloadItem(data),
      onDeleteClick: (beforeDelete: () => void, afterDelete: () => void) =>
        this.deleteItem(data, beforeDelete, afterDelete),
    };

    return (
      <div style={{ float: "left", padding: 5 }}>
        <GalleryCardComponent {...props} />
      </div>
    );
  };

  private loadTaggedItems = (tag: string): void => {
    const searchText = tag;
    this.setState({
      searchText,
    });

    this.loadTabContent(this.state.selectedTab, searchText, this.state.sortBy, true);
    this.props.onSearchTextChange && this.props.onSearchTextChange(searchText);
  };

  private favoriteItem = async (data: IGalleryItem): Promise<void> => {
    GalleryUtils.favoriteItem(this.props.container, this.props.junoClient, data, (item: IGalleryItem) => {
      if (this.favoriteNotebooks) {
        this.favoriteNotebooks.push(item);
      } else {
        this.favoriteNotebooks = [item];
      }
      this.refreshSelectedTab(item);
    });
  };

  private unfavoriteItem = async (data: IGalleryItem): Promise<void> => {
    GalleryUtils.unfavoriteItem(this.props.container, this.props.junoClient, data, (item: IGalleryItem) => {
      this.favoriteNotebooks = this.favoriteNotebooks?.filter((value) => value.id !== item.id);
      this.refreshSelectedTab(item);
    });
  };

  private downloadItem = async (data: IGalleryItem): Promise<void> => {
    GalleryUtils.downloadItem(this.props.container, this.props.junoClient, data, (item) =>
      this.refreshSelectedTab(item)
    );
  };

  private deleteItem = async (data: IGalleryItem, beforeDelete: () => void, afterDelete: () => void): Promise<void> => {
    GalleryUtils.deleteItem(
      this.props.container,
      this.props.junoClient,
      data,
      (item) => {
        this.publishedNotebooks = this.publishedNotebooks?.filter((notebook) => item.id !== notebook.id);
        this.refreshSelectedTab(item);
      },
      beforeDelete,
      afterDelete
    );
  };

  private onPivotChange = (item: PivotItem): void => {
    const selectedTab = GalleryTab[item.props.itemKey as keyof typeof GalleryTab];
    const searchText: string = undefined;
    this.setState({
      selectedTab,
      searchText,
    });

    this.loadTabContent(selectedTab, searchText, this.state.sortBy, false);
    this.props.onSelectedTabChange && this.props.onSelectedTabChange(selectedTab);
  };

  private onSearchBoxChange = (event?: React.ChangeEvent<HTMLInputElement>, newValue?: string): void => {
    const searchText = newValue;
    this.setState({
      searchText,
    });

    this.loadTabContent(this.state.selectedTab, searchText, this.state.sortBy, true);
    this.props.onSearchTextChange && this.props.onSearchTextChange(searchText);
  };

  private onDropdownChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    const sortBy = option.key as SortBy;
    this.setState({
      sortBy,
    });

    this.loadTabContent(this.state.selectedTab, this.state.searchText, sortBy, true);
    this.props.onSortByChange && this.props.onSortByChange(sortBy);
  };
}
