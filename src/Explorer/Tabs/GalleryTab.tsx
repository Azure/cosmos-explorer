import React from "react";
import type { DatabaseAccount } from "../../Contracts/DataModels";
import type { TabOptions } from "../../Contracts/ViewModels";
import type { IGalleryItem, JunoClient } from "../../Juno/JunoClient";
import { GalleryAndNotebookViewerComponent as GalleryViewer } from "../Controls/NotebookGallery/GalleryAndNotebookViewerComponent";
import type { GalleryTab as GalleryViewerTab } from "../Controls/NotebookGallery/GalleryViewerComponent";
import { SortBy } from "../Controls/NotebookGallery/GalleryViewerComponent";
import type Explorer from "../Explorer";
import TabsBase from "./TabsBase";

interface Props {
  account: DatabaseAccount;
  container: Explorer;
  junoClient: JunoClient;
  selectedTab: GalleryViewerTab;
  notebookUrl?: string;
  galleryItem?: IGalleryItem;
  isFavorite?: boolean;
}

export default class GalleryTab extends TabsBase {
  constructor(
    options: TabOptions,
    private props: Props,
  ) {
    super(options);
  }

  public render() {
    return <GalleryViewer {...this.props} sortBy={SortBy.MostRecent} searchText={undefined} />;
  }

  public getContainer(): Explorer {
    return this.props.container;
  }
}
