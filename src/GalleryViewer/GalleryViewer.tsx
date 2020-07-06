import "bootstrap/dist/css/bootstrap.css";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { initializeConfiguration } from "../Config";
import {
  GalleryTab,
  GalleryViewerComponent,
  GalleryViewerComponentProps,
  SortBy
} from "../Explorer/Controls/NotebookGallery/GalleryViewerComponent";
import { JunoClient } from "../Juno/JunoClient";
import * as GalleryUtils from "../Utils/GalleryUtils";

const onInit = async () => {
  initializeIcons();
  await initializeConfiguration();
  const galleryViewerProps = GalleryUtils.getGalleryViewerProps(window.location.search);

  const props: GalleryViewerComponentProps = {
    junoClient: new JunoClient(),
    selectedTab: galleryViewerProps.selectedTab || GalleryTab.OfficialSamples,
    sortBy: galleryViewerProps.sortBy || SortBy.MostViewed,
    searchText: galleryViewerProps.searchText,
    onSelectedTabChange: undefined,
    onSortByChange: undefined,
    onSearchTextChange: undefined
  };

  ReactDOM.render(<GalleryViewerComponent {...props} />, document.getElementById("galleryContent"));
};

// Entry point
window.addEventListener("load", onInit);
