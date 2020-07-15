import "bootstrap/dist/css/bootstrap.css";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { initializeConfiguration } from "../Config";
import { GalleryHeaderComponent } from "../Explorer/Controls/Header/GalleryHeaderComponent";
import {
  GalleryAndNotebookViewerComponent,
  GalleryAndNotebookViewerComponentProps
} from "../Explorer/Controls/NotebookGallery/GalleryAndNotebookViewerComponent";
import { GalleryTab, SortBy } from "../Explorer/Controls/NotebookGallery/GalleryViewerComponent";
import { JunoClient } from "../Juno/JunoClient";
import * as GalleryUtils from "../Utils/GalleryUtils";

const onInit = async () => {
  initializeIcons();
  await initializeConfiguration();
  const galleryViewerProps = GalleryUtils.getGalleryViewerProps(window.location.search);

  const props: GalleryAndNotebookViewerComponentProps = {
    junoClient: new JunoClient(),
    selectedTab: galleryViewerProps.selectedTab || GalleryTab.OfficialSamples,
    sortBy: galleryViewerProps.sortBy || SortBy.MostViewed,
    searchText: galleryViewerProps.searchText
  };

  const element = (
    <>
      <header>
        <GalleryHeaderComponent />
      </header>
      <div style={{ marginLeft: 138, marginRight: 138 }}>
        <GalleryAndNotebookViewerComponent {...props} />
      </div>
    </>
  );

  ReactDOM.render(element, document.getElementById("galleryContent"));
};

// Entry point
window.addEventListener("load", onInit);
