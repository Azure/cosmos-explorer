import {
  Dropdown,
  FocusZone,
  FontWeights,
  IDropdownOption,
  IPageSpecification,
  IPivotItemProps,
  IPivotProps,
  IRectangle,
  Label,
  List,
  Pivot,
  PivotItem,
  SearchBox,
  Stack,
  Text
} from "office-ui-fabric-react";
import * as React from "react";
import { IGalleryItem, JunoClient, IJunoResponse, IPublicGalleryData } from "../../../Juno/JunoClient";
import * as GalleryUtils from "../../../Utils/GalleryUtils";
import { DialogComponent, DialogProps } from "../DialogReactComponent/DialogComponent";
import { GalleryCardComponent, GalleryCardComponentProps } from "./Cards/GalleryCardComponent";
import "./GalleryViewerComponent.less";
import { HttpStatusCodes } from "../../../Common/Constants";
import Explorer from "../../Explorer";
import { CodeOfConductComponent } from "./CodeOfConductComponent";
import { InfoComponent } from "./InfoComponent/InfoComponent";
import { handleError } from "../../../Common/ErrorHandlingUtils";

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
  OfficialSamples,
  PublicGallery,
  Favorites,
  Published
}

export enum SortBy {
  MostViewed,
  MostDownloaded,
  MostFavorited,
  MostRecent
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
}

interface GalleryTabInfo {
  tab: GalleryTab;
  content: JSX.Element;
}

export class GalleryViewerComponent extends React.Component<GalleryViewerComponentProps, GalleryViewerComponentState> {
  public static readonly OfficialSamplesTitle = "Official samples";
  public static readonly PublicGalleryTitle = "Public gallery";
  public static readonly FavoritesTitle = "Liked";
  public static readonly PublishedTitle = "Your published work";

  private static readonly rowsPerPage = 5;

  private static readonly mostViewedText = "Most viewed";
  private static readonly mostDownloadedText = "Most downloaded";
  private static readonly mostFavoritedText = "Most liked";
  private static readonly mostRecentText = "Most recent";

  private readonly sortingOptions: IDropdownOption[];

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
      isCodeOfConductAccepted: undefined
    };

    this.sortingOptions = [
      {
        key: SortBy.MostViewed,
        text: GalleryViewerComponent.mostViewedText
      },
      {
        key: SortBy.MostDownloaded,
        text: GalleryViewerComponent.mostDownloadedText
      },
      {
        key: SortBy.MostRecent,
        text: GalleryViewerComponent.mostRecentText
      }
    ];
    if (this.props.container?.isGalleryPublishEnabled()) {
      this.sortingOptions.push({
        key: SortBy.MostFavorited,
        text: GalleryViewerComponent.mostFavoritedText
      });
    }

    this.loadTabContent(this.state.selectedTab, this.state.searchText, this.state.sortBy, false);
    if (this.props.container?.isGalleryPublishEnabled()) {
      this.loadFavoriteNotebooks(this.state.searchText, this.state.sortBy, false); // Need this to show correct favorite button state
    }
  }

  public render(): JSX.Element {
    const tabs: GalleryTabInfo[] = [this.createTab(GalleryTab.OfficialSamples, this.state.sampleNotebooks)];

    if (this.props.container?.isGalleryPublishEnabled()) {
      tabs.push(
        this.createPublicGalleryTab(
          GalleryTab.PublicGallery,
          this.state.publicNotebooks,
          this.state.isCodeOfConductAccepted
        )
      );
      tabs.push(this.createTab(GalleryTab.Favorites, this.state.favoriteNotebooks));

      // explicitly checking if isCodeOfConductAccepted is not false, as it is initially undefined.
      // Displaying code of conduct component on gallery load should not be the default behavior.
      if (this.state.isCodeOfConductAccepted !== false) {
        tabs.push(this.createPublishedNotebooksTab(GalleryTab.Published, this.state.publishedNotebooks));
      }
    }

    const pivotProps: IPivotProps = {
      onLinkClick: this.onPivotChange,
      selectedKey: GalleryTab[this.state.selectedTab]
    };

    const pivotItems = tabs.map(tab => {
      const pivotItemProps: IPivotItemProps = {
        itemKey: GalleryTab[tab.tab],
        style: { marginTop: 20 },
        headerText: GalleryUtils.getTabTitle(tab.tab)
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

        {this.state.dialogProps && <DialogComponent {...this.state.dialogProps} />}
      </div>
    );
  }

  private createPublicGalleryTab(
    tab: GalleryTab,
    data: IGalleryItem[],
    acceptedCodeOfConduct: boolean
  ): GalleryTabInfo {
    return {
      tab,
      content: this.createPublicGalleryTabContent(data, acceptedCodeOfConduct)
    };
  }

  private createTab(tab: GalleryTab, data: IGalleryItem[]): GalleryTabInfo {
    return {
      tab,
      content: this.createSearchBarHeader(this.createCardsTabContent(data))
    };
  }

  private createPublishedNotebooksTab = (tab: GalleryTab, data: IGalleryItem[]): GalleryTabInfo => {
    return {
      tab,
      content: this.createPublishedNotebooksTabContent(data)
    };
  };

  private createPublishedNotebooksTabContent = (data: IGalleryItem[]): JSX.Element => {
    const { published, underReview, removed } = GalleryUtils.filterPublishedNotebooks(data);
    const content = (
      <Stack tokens={{ childrenGap: 10 }}>
        {published?.length > 0 &&
          this.createPublishedNotebooksSectionContent(
            undefined,
            "You have successfully published the following notebook(s) to public gallery and shared with other Azure Cosmos DB users.",
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
      <Stack tokens={{ childrenGap: 5 }}>
        {title && <Text styles={{ root: { fontWeight: FontWeights.semibold } }}>{title}</Text>}
        {description && <Text>{description}</Text>}
        {content}
      </Stack>
    );
  };

  private createPublicGalleryTabContent(data: IGalleryItem[], acceptedCodeOfConduct: boolean): JSX.Element {
    return acceptedCodeOfConduct === false ? (
      <CodeOfConductComponent
        junoClient={this.props.junoClient}
        onAcceptCodeOfConduct={(result: boolean) => {
          this.setState({ isCodeOfConductAccepted: result });
        }}
      />
    ) : (
      this.createSearchBarHeader(this.createCardsTabContent(data))
    );
  }

  private createSearchBarHeader(content: JSX.Element): JSX.Element {
    return (
      <Stack tokens={{ childrenGap: 10 }}>
        <Stack horizontal tokens={{ childrenGap: 20, padding: 10 }}>
          <Stack.Item grow>
            <SearchBox value={this.state.searchText} placeholder="Search" onChange={this.onSearchBoxChange} />
          </Stack.Item>
          <Stack.Item>
            <Label>Sort by</Label>
          </Stack.Item>
          <Stack.Item styles={{ root: { minWidth: 200 } }}>
            <Dropdown options={this.sortingOptions} selectedKey={this.state.sortBy} onChange={this.onDropdownChange} />
          </Stack.Item>
          {(!this.props.container || this.props.container.isGalleryPublishEnabled()) && (
            <Stack.Item>
              <InfoComponent />
            </Stack.Item>
          )}
        </Stack>
        <Stack.Item>{content}</Stack.Item>
      </Stack>
    );
  }

  private createCardsTabContent(data: IGalleryItem[]): JSX.Element {
    return (
      <FocusZone>
        <List
          items={data}
          getPageSpecification={this.getPageSpecification}
          renderedWindowsAhead={3}
          onRenderCell={this.onRenderCell}
        />
      </FocusZone>
    );
  }

  private createPolicyViolationsListContent(data: IGalleryItem[]): JSX.Element {
    return (
      <table>
        <tbody>
          <tr>
            <th>Name</th>
            <th>Policy violations</th>
          </tr>
          {data.map(item => (
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
      case GalleryTab.OfficialSamples:
        this.loadSampleNotebooks(searchText, sortBy, offline);
        break;

      case GalleryTab.PublicGallery:
        this.loadPublicNotebooks(searchText, sortBy, offline);
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
      } catch (error) {
        handleError(error, "GalleryViewerComponent/loadSampleNotebooks", "Failed to load sample notebooks");
      }
    }

    this.setState({
      sampleNotebooks: this.sampleNotebooks && [...this.sort(sortBy, this.search(searchText, this.sampleNotebooks))]
    });
  }

  private async loadPublicNotebooks(searchText: string, sortBy: SortBy, offline: boolean): Promise<void> {
    if (!offline) {
      try {
        let response: IJunoResponse<IPublicGalleryData> | IJunoResponse<IGalleryItem[]>;
        if (this.props.container.isCodeOfConductEnabled()) {
          response = await this.props.junoClient.fetchPublicNotebooks();
          this.isCodeOfConductAccepted = response.data?.metadata.acceptedCodeOfConduct;
          this.publicNotebooks = response.data?.notebooksData;
        } else {
          response = await this.props.junoClient.getPublicNotebooks();
          this.publicNotebooks = response.data;
        }

        if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
          throw new Error(`Received HTTP ${response.status} when loading public notebooks`);
        }
      } catch (error) {
        handleError(error, "GalleryViewerComponent/loadPublicNotebooks", "Failed to load public notebooks");
      }
    }

    this.setState({
      publicNotebooks: this.publicNotebooks && [...this.sort(sortBy, this.search(searchText, this.publicNotebooks))],
      isCodeOfConductAccepted: this.isCodeOfConductAccepted
    });
  }

  private async loadFavoriteNotebooks(searchText: string, sortBy: SortBy, offline: boolean): Promise<void> {
    if (!offline) {
      try {
        const response = await this.props.junoClient.getFavoriteNotebooks();
        if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
          throw new Error(`Received HTTP ${response.status} when loading favorite notebooks`);
        }

        this.favoriteNotebooks = response.data;
      } catch (error) {
        handleError(error, "GalleryViewerComponent/loadFavoriteNotebooks", "Failed to load favorite notebooks");
      }
    }

    this.setState({
      favoriteNotebooks: this.favoriteNotebooks && [
        ...this.sort(sortBy, this.search(searchText, this.favoriteNotebooks))
      ]
    });

    // Refresh favorite button state
    if (this.state.selectedTab !== GalleryTab.Favorites) {
      this.refreshSelectedTab();
    }
  }

  private async loadPublishedNotebooks(searchText: string, sortBy: SortBy, offline: boolean): Promise<void> {
    if (!offline) {
      try {
        const response = await this.props.junoClient.getPublishedNotebooks();
        if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
          throw new Error(`Received HTTP ${response.status} when loading published notebooks`);
        }

        this.publishedNotebooks = response.data;
      } catch (error) {
        handleError(error, "GalleryViewerComponent/loadPublishedNotebooks", "Failed to load published notebooks");
      }
    }

    this.setState({
      publishedNotebooks: this.publishedNotebooks && [
        ...this.sort(sortBy, this.search(searchText, this.publishedNotebooks))
      ]
    });
  }

  private search(searchText: string, data: IGalleryItem[]): IGalleryItem[] {
    if (searchText) {
      return data?.filter(item => this.isGalleryItemPresent(searchText, item));
    }

    return data;
  }

  private isGalleryItemPresent(searchText: string, item: IGalleryItem): boolean {
    const toSearch = searchText.trim().toUpperCase();
    const searchData: string[] = [item.author.toUpperCase(), item.description.toUpperCase(), item.name.toUpperCase()];

    if (item.tags) {
      searchData.push(...item.tags.map(tag => tag.toUpperCase()));
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
    const index = items?.findIndex(value => value.id === item.id);
    if (index !== -1) {
      items?.splice(index, 1, item);
    }
  }

  private getPageSpecification = (itemIndex?: number, visibleRect?: IRectangle): IPageSpecification => {
    if (itemIndex === 0) {
      this.columnCount = Math.floor(visibleRect.width / GalleryCardComponent.CARD_WIDTH) || this.columnCount;
      this.rowCount = GalleryViewerComponent.rowsPerPage;
    }

    return {
      height: visibleRect.height,
      itemCount: this.columnCount * this.rowCount
    };
  };

  private onRenderCell = (data?: IGalleryItem): JSX.Element => {
    let isFavorite: boolean;
    if (this.props.container?.isGalleryPublishEnabled()) {
      isFavorite = this.favoriteNotebooks?.find(item => item.id === data.id) !== undefined;
    }
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
      onDeleteClick: () => this.deleteItem(data)
    };

    return (
      <div style={{ float: "left", padding: 10 }}>
        <GalleryCardComponent {...props} />
      </div>
    );
  };

  private loadTaggedItems = (tag: string): void => {
    const searchText = tag;
    this.setState({
      searchText
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
      this.favoriteNotebooks = this.favoriteNotebooks?.filter(value => value.id !== item.id);
      this.refreshSelectedTab(item);
    });
  };

  private downloadItem = async (data: IGalleryItem): Promise<void> => {
    GalleryUtils.downloadItem(this.props.container, this.props.junoClient, data, item => this.refreshSelectedTab(item));
  };

  private deleteItem = async (data: IGalleryItem): Promise<void> => {
    GalleryUtils.deleteItem(this.props.container, this.props.junoClient, data, item => {
      this.publishedNotebooks = this.publishedNotebooks?.filter(notebook => item.id !== notebook.id);
      this.refreshSelectedTab(item);
    });
  };

  private onPivotChange = (item: PivotItem): void => {
    const selectedTab = GalleryTab[item.props.itemKey as keyof typeof GalleryTab];
    const searchText: string = undefined;
    this.setState({
      selectedTab,
      searchText
    });

    this.loadTabContent(selectedTab, searchText, this.state.sortBy, false);
    this.props.onSelectedTabChange && this.props.onSelectedTabChange(selectedTab);
  };

  private onSearchBoxChange = (event?: React.ChangeEvent<HTMLInputElement>, newValue?: string): void => {
    const searchText = newValue;
    this.setState({
      searchText
    });

    this.loadTabContent(this.state.selectedTab, searchText, this.state.sortBy, true);
    this.props.onSearchTextChange && this.props.onSearchTextChange(searchText);
  };

  private onDropdownChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    const sortBy = option.key as SortBy;
    this.setState({
      sortBy
    });

    this.loadTabContent(this.state.selectedTab, this.state.searchText, sortBy, true);
    this.props.onSortByChange && this.props.onSortByChange(sortBy);
  };
}
