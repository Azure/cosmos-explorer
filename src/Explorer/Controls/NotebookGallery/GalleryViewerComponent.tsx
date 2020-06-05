/**
 * Gallery Viewer
 */

import * as React from "react";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { GalleryCardComponent } from "./Cards/GalleryCardComponent";
import { Stack, IStackTokens } from "office-ui-fabric-react";
import { JunoUtils } from "../../../Utils/JunoUtils";
import { CosmosClient } from "../../../Common/CosmosClient";
import { config } from "../../../Config";
import path from "path";
import { SessionStorageUtility, StorageKey } from "../../../Shared/StorageUtility";
import { NotificationConsoleUtils } from "../../../Utils/NotificationConsoleUtils";
import { ConsoleDataType } from "../../Menus/NotificationConsole/NotificationConsoleComponent";
import * as TabComponent from "../Tabs/TabComponent";

import "./GalleryViewerComponent.less";

export interface GalleryCardsComponentProps {
  data: DataModels.GitHubInfoJunoResponse[];
  userMetadata: DataModels.UserMetadata;
  onNotebookMetadataChange: (
    officialSamplesIndex: number,
    notebookMetadata: DataModels.NotebookMetadata
  ) => Promise<void>;
  onClick: (
    url: string,
    notebookMetadata: DataModels.NotebookMetadata,
    onNotebookMetadataChange: (newNotebookMetadata: DataModels.NotebookMetadata) => Promise<void>,
    isLikedNotebook: boolean
  ) => Promise<void>;
}

export class GalleryCardsComponent extends React.Component<GalleryCardsComponentProps> {
  private sectionStackTokens: IStackTokens = { childrenGap: 30 };

  public render(): JSX.Element {
    return (
      <Stack horizontal wrap tokens={this.sectionStackTokens}>
        {this.props.data.map((githubInfo: DataModels.GitHubInfoJunoResponse, index: any) => {
          const name = githubInfo.name;
          const url = githubInfo.downloadUrl;
          const notebookMetadata = githubInfo.metadata || {
            date: "2008-12-01",
            description: "Great notebook",
            tags: ["favorite", "sample"],
            author: "Laurent Nguyen",
            views: 432,
            likes: 123,
            downloads: 56,
            imageUrl:
              "https://media.magazine.ferrari.com/images/2019/02/27/170304506-c1bcf028-b513-45f6-9f27-0cadac619c3d.jpg"
          };
          const officialSamplesIndex = githubInfo.officialSamplesIndex;
          const isLikedNotebook = githubInfo.isLikedNotebook;
          const updateTabsStatePerNotebook = this.props.onNotebookMetadataChange
            ? (notebookMetadata: DataModels.NotebookMetadata) =>
                this.props.onNotebookMetadataChange(officialSamplesIndex, notebookMetadata)
            : undefined;

          return (
            name !== ".gitignore" &&
            url && (
              <GalleryCardComponent
                key={url}
                name={name}
                url={url}
                notebookMetadata={notebookMetadata}
                onClick={() => this.props.onClick(url, notebookMetadata, updateTabsStatePerNotebook, isLikedNotebook)}
              />
            )
          );
        })}
      </Stack>
    );
  }
}

export interface FullWidthTabsProps {
  officialSamplesContent: DataModels.GitHubInfoJunoResponse[];
  likedNotebooksContent: DataModels.GitHubInfoJunoResponse[];
  userMetadata: DataModels.UserMetadata;
  onClick: (
    url: string,
    notebookMetadata: DataModels.NotebookMetadata,
    onNotebookMetadataChange: (newNotebookMetadata: DataModels.NotebookMetadata) => Promise<void>,
    isLikedNotebook: boolean
  ) => Promise<void>;
}

interface FullWidthTabsState {
  activeTabIndex: number;
  officialSamplesContent: DataModels.GitHubInfoJunoResponse[];
  likedNotebooksContent: DataModels.GitHubInfoJunoResponse[];
  userMetadata: DataModels.UserMetadata;
}

export class FullWidthTabs extends React.Component<FullWidthTabsProps, FullWidthTabsState> {
  private authorizationToken = CosmosClient.authorizationToken();
  private appTabs: TabComponent.Tab[];

  constructor(props: FullWidthTabsProps) {
    super(props);
    this.state = {
      activeTabIndex: 0,
      officialSamplesContent: this.props.officialSamplesContent,
      likedNotebooksContent: this.props.likedNotebooksContent,
      userMetadata: this.props.userMetadata
    };

    this.appTabs = [
      {
        title: "Official Samples",
        content: {
          className: "",
          render: () => (
            <GalleryCardsComponent
              data={this.state.officialSamplesContent}
              onClick={this.props.onClick}
              userMetadata={this.state.userMetadata}
              onNotebookMetadataChange={this.updateTabsState}
            />
          )
        },
        isVisible: () => true
      },
      {
        title: "Liked Notebooks",
        content: {
          className: "",
          render: () => (
            <GalleryCardsComponent
              data={this.state.likedNotebooksContent}
              onClick={this.props.onClick}
              userMetadata={this.state.userMetadata}
              onNotebookMetadataChange={this.updateTabsState}
            />
          )
        },
        isVisible: () => true
      }
    ];
  }

  public updateTabsState = async (officialSamplesIndex: number, notebookMetadata: DataModels.NotebookMetadata) => {
    let currentLikedNotebooksContent = [...this.state.likedNotebooksContent];
    let currentUserMetadata = { ...this.state.userMetadata };
    let currentLikedNotebooks = [...currentUserMetadata.likedNotebooks];

    const currentOfficialSamplesContent = [...this.state.officialSamplesContent];
    const currentOfficialSamplesObject = { ...currentOfficialSamplesContent[officialSamplesIndex] };
    const metadata = { ...currentOfficialSamplesObject.metadata };
    const metadataLikesUpdates = metadata.likes - notebookMetadata.likes;

    metadata.views = notebookMetadata.views;
    metadata.downloads = notebookMetadata.downloads;
    metadata.likes = notebookMetadata.likes;
    currentOfficialSamplesObject.metadata = metadata;

    // Notebook has been liked. Add To likedNotebooksContent, update isLikedNotebook flag
    if (metadataLikesUpdates < 0) {
      currentOfficialSamplesObject.isLikedNotebook = true;
      currentLikedNotebooksContent = currentLikedNotebooksContent.concat(currentOfficialSamplesObject);
      currentLikedNotebooks = currentLikedNotebooks.concat(currentOfficialSamplesObject.path);
      currentUserMetadata = { likedNotebooks: currentLikedNotebooks };
    } else if (metadataLikesUpdates > 0) {
      // Notebook has been unliked. Remove from likedNotebooksContent after matching the path, update isLikedNotebook flag

      currentOfficialSamplesObject.isLikedNotebook = false;
      const likedNotebookIndex = currentLikedNotebooks.findIndex((path: string) => {
        return path === currentOfficialSamplesObject.path;
      });
      currentLikedNotebooksContent.splice(likedNotebookIndex, 1);
      currentLikedNotebooks.splice(likedNotebookIndex, 1);
      currentUserMetadata = { likedNotebooks: currentLikedNotebooks };
    }

    currentOfficialSamplesContent[officialSamplesIndex] = currentOfficialSamplesObject;

    this.setState({
      activeTabIndex: 0,
      userMetadata: currentUserMetadata,
      likedNotebooksContent: currentLikedNotebooksContent,
      officialSamplesContent: currentOfficialSamplesContent
    });

    JunoUtils.updateNotebookMetadata(this.authorizationToken, notebookMetadata).then(
      async returnedNotebookMetadata => {
        if (metadataLikesUpdates !== 0) {
          JunoUtils.updateUserMetadata(this.authorizationToken, currentUserMetadata);
          // TODO: update state here?
        }
      },
      error => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error updating notebook metadata: ${JSON.stringify(error)}`
        );
        // TODO add telemetry
      }
    );
  };

  private onTabIndexChange = (activeTabIndex: number) => this.setState({ activeTabIndex });

  public render() {
    return (
      <TabComponent.TabComponent
        tabs={this.appTabs}
        onTabIndexChange={this.onTabIndexChange.bind(this)}
        currentTabIndex={this.state.activeTabIndex}
        hideHeader={false}
      />
    );
  }
}

export interface GalleryViewerContainerComponentProps {
  container: ViewModels.Explorer;
}

interface GalleryViewerContainerComponentState {
  officialSamplesData: DataModels.GitHubInfoJunoResponse[];
  likedNotebooksData: DataModels.LikedNotebooksJunoResponse;
}

export class GalleryViewerContainerComponent extends React.Component<
  GalleryViewerContainerComponentProps,
  GalleryViewerContainerComponentState
> {
  constructor(props: GalleryViewerContainerComponentProps) {
    super(props);
    this.state = {
      officialSamplesData: undefined,
      likedNotebooksData: undefined
    };
  }

  componentDidMount() {
    const authToken = CosmosClient.authorizationToken();
    JunoUtils.getOfficialSampleNotebooks(authToken).then(
      (data1: DataModels.GitHubInfoJunoResponse[]) => {
        const officialSamplesData = data1;

        JunoUtils.getLikedNotebooks(authToken).then(
          (data2: DataModels.LikedNotebooksJunoResponse) => {
            const likedNotebooksData = data2;

            officialSamplesData.map((value: DataModels.GitHubInfoJunoResponse, index: number) => {
              value.officialSamplesIndex = index;
              value.isLikedNotebook = likedNotebooksData.userMetadata.likedNotebooks.includes(value.path);
            });

            likedNotebooksData.likedNotebooksContent.map((value: DataModels.GitHubInfoJunoResponse) => {
              value.isLikedNotebook = true;
              value.officialSamplesIndex = officialSamplesData.findIndex(
                (officialSample: DataModels.GitHubInfoJunoResponse) => {
                  return officialSample.path === value.path;
                }
              );
            });

            this.setState({
              officialSamplesData: officialSamplesData,
              likedNotebooksData: likedNotebooksData
            });
          },
          error => {
            NotificationConsoleUtils.logConsoleMessage(
              ConsoleDataType.Error,
              `Error fetching liked notebooks: ${JSON.stringify(error)}`
            );
            // TODO Add telemetry
          }
        );
      },
      error => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error fetching sample notebooks: ${JSON.stringify(error)}`
        );
        // TODO Add telemetry
      }
    );
  }

  public render(): JSX.Element {
    return this.state.officialSamplesData && this.state.likedNotebooksData ? (
      <GalleryViewerComponent
        container={this.props.container}
        officialSamplesData={this.state.officialSamplesData}
        likedNotebookData={this.state.likedNotebooksData}
      />
    ) : (
      <></>
    );
  }
}

export interface GalleryViewerComponentProps {
  container: ViewModels.Explorer;
  officialSamplesData: DataModels.GitHubInfoJunoResponse[];
  likedNotebookData: DataModels.LikedNotebooksJunoResponse;
}

export class GalleryViewerComponent extends React.Component<GalleryViewerComponentProps> {
  public render(): JSX.Element {
    return this.props.container ? (
      <div className="galleryContainer">
        <FullWidthTabs
          officialSamplesContent={this.props.officialSamplesData}
          likedNotebooksContent={this.props.likedNotebookData.likedNotebooksContent}
          userMetadata={this.props.likedNotebookData.userMetadata}
          onClick={this.openNotebookViewer}
        />
      </div>
    ) : (
      <div className="galleryContainer">
        <GalleryCardsComponent
          data={this.props.officialSamplesData}
          onClick={this.openNotebookViewer}
          userMetadata={undefined}
          onNotebookMetadataChange={undefined}
        />
      </div>
    );
  }

  public getOfficialSamplesData(): DataModels.GitHubInfoJunoResponse[] {
    return this.props.officialSamplesData;
  }

  public getLikedNotebookData(): DataModels.LikedNotebooksJunoResponse {
    return this.props.likedNotebookData;
  }

  public openNotebookViewer = async (
    url: string,
    notebookMetadata: DataModels.NotebookMetadata,
    onNotebookMetadataChange: (newNotebookMetadata: DataModels.NotebookMetadata) => Promise<void>,
    isLikedNotebook: boolean
  ) => {
    if (!this.props.container) {
      SessionStorageUtility.setEntryString(
        StorageKey.NotebookMetadata,
        notebookMetadata ? JSON.stringify(notebookMetadata) : null
      );
      SessionStorageUtility.setEntryString(StorageKey.NotebookName, path.basename(url));
      window.open(`${config.hostedExplorerURL}notebookViewer.html?notebookurl=${url}`, "_blank");
    } else {
      this.props.container.openNotebookViewer(url, notebookMetadata, onNotebookMetadataChange, isLikedNotebook);
    }
  };
}
