/**
 * Gallery Viewer
 */

import * as React from "react";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import { GalleryCardComponent } from "./Cards/GalleryCardComponent";
import { Stack, IStackTokens } from "office-ui-fabric-react";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import { JunoUtils } from "../Utils/JunoUtils";
import { CosmosClient } from "../Common/CosmosClient";
import { config } from "../Config";
import path from "path";
import { SessionStorageUtility, StorageKey } from "../Shared/StorageUtility";
import "./GalleryViewer.less";

interface GalleryCardsComponentProps {
  data: DataModels.GitHubInfoJunoResponse[];
  onClick: (url: string, notebookMetadata: DataModels.NotebookMetadata) => Promise<void>;
}

class GalleryCardsComponent extends React.Component<GalleryCardsComponentProps> {
  private sectionStackTokens: IStackTokens = { childrenGap: 30 };
  public render(): JSX.Element {
    return (
      <Stack horizontal wrap tokens={this.sectionStackTokens}>
        {this.props.data.map((githubInfo: DataModels.GitHubInfoJunoResponse, index: any) => {
          const name = githubInfo.name;
          const url = githubInfo.downloadUrl;
          const notebookMetadata = githubInfo.metadata;

          return (
            name !== ".gitignore" &&
            url && (
              <GalleryCardComponent
                key={url}
                name={name}
                url={url}
                notebookMetadata={notebookMetadata}
                onClick={() => this.props.onClick(url, notebookMetadata)}
              />
            )
          );
        })}
      </Stack>
    );
  }
}

const TabPanel = (props: any) => (
  <Typography
    component="div"
    role="tabpanel"
    hidden={props.value !== props.index}
    id={`full-width-tabpanel-${props.index}`}
    aria-labelledby={`full-width-tab-${props.index}`}
  >
    {props.value === props.index && <Box p={2}>{props.children}</Box>}
  </Typography>
);

const a11yProps = (index: number) => {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`
  };
};

interface FullWidthTabsProps {
  officialSamplesContent: DataModels.GitHubInfoJunoResponse[];
  likedNotebooksContent: DataModels.GitHubInfoJunoResponse[];
  onClick: (url: string, notebookMetadata: DataModels.NotebookMetadata) => Promise<void>;
}

const FullWidthTabs = (props: FullWidthTabsProps) => {
  const [value, setValue] = React.useState(0);

  const handleChange = ({}, newValue: any) => {
    setValue(newValue);
  };

  return (
    <>
      <AppBar position="static" color="transparent" style={{ background: "transparent", boxShadow: "none" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          aria-label="gallery tabs"
        >
          <Tab label="Official Samples" {...a11yProps(0)} />
          <Tab label="Liked Notebooks" {...a11yProps(1)} />
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={0}>
        <GalleryCardsComponent data={props.officialSamplesContent} onClick={props.onClick} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <GalleryCardsComponent data={props.likedNotebooksContent} onClick={props.onClick} />
      </TabPanel>
    </>
  );
};

export interface GalleryViewerContainerComponentProps {
  container: ViewModels.Explorer;
}

export interface GalleryViewerContainerComponentState {
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
    JunoUtils.getOfficialSampleNotebooks().then((data1: DataModels.GitHubInfoJunoResponse[]) => {
      const officialSamplesData = data1;

      JunoUtils.getLikedNotebooks(CosmosClient.authorizationToken()).then(
        (data2: DataModels.LikedNotebooksJunoResponse) => {
          const likedNotebooksData = data2;

          this.setState({
            officialSamplesData: officialSamplesData,
            likedNotebooksData: likedNotebooksData
          });
        }
      );
    });
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
  private authorizationToken = CosmosClient.authorizationToken();

  public render(): JSX.Element {
    return this.props.container ? (
      <div className="galleryContainer">
        <FullWidthTabs
          officialSamplesContent={this.props.officialSamplesData}
          likedNotebooksContent={this.props.likedNotebookData.likedNotebooksContent}
          onClick={this.openNotebookViewer}
        />
      </div>
    ) : (
      <div className="galleryContainer">
        <GalleryCardsComponent data={this.props.officialSamplesData} onClick={this.openNotebookViewer} />
      </div>
    );
  }

  public getOfficialSamplesData(): DataModels.GitHubInfoJunoResponse[] {
    return this.props.officialSamplesData;
  }

  public getLikedNotebookData(): DataModels.LikedNotebooksJunoResponse {
    return this.props.likedNotebookData;
  }

  public openNotebookViewer = async (url: string, notebookMetadata: DataModels.NotebookMetadata) => {
    if (!this.props.container) {
      SessionStorageUtility.setEntryString(
        StorageKey.NotebookMetadata,
        notebookMetadata ? JSON.stringify(notebookMetadata) : null
      );
      SessionStorageUtility.setEntryString(StorageKey.NotebookName, path.basename(url));
      window.open(`${config.hostedExplorerURL}notebookViewer.html?notebookurl=${url}`, "_blank");
    } else {
      this.props.container.openNotebookViewer(url, notebookMetadata);
    }
  };
}
