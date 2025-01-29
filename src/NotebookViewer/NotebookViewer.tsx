// import { initializeIcons } from "@fluentui/react";
import "bootstrap/dist/css/bootstrap.css";
import React from "react";
import * as ReactDOM from "react-dom";
import { configContext, initializeConfiguration } from "../ConfigContext";
import { GalleryHeaderComponent } from "../Explorer/Controls/Header/GalleryHeaderComponent";
import { GalleryTab } from "../Explorer/Controls/NotebookGallery/GalleryViewerComponent";
import {
  NotebookViewerComponent,
  NotebookViewerComponentProps,
} from "../Explorer/Controls/NotebookViewer/NotebookViewerComponent";
import * as FileSystemUtil from "../Explorer/Notebook/FileSystemUtil";
import { IGalleryItem, JunoClient } from "../Juno/JunoClient";
import * as GalleryUtils from "../Utils/GalleryUtils";

const onInit = async () => {
  // initializeIcons();
  await initializeConfiguration();
  const galleryViewerProps = GalleryUtils.getGalleryViewerProps(window.location.search);
  const notebookViewerProps = GalleryUtils.getNotebookViewerProps(window.location.search);
  let backNavigationText: string;
  let onBackClick: () => void;
  if (galleryViewerProps.selectedTab !== undefined) {
    backNavigationText = GalleryUtils.getTabTitle(galleryViewerProps.selectedTab);
    onBackClick = () =>
      (window.location.href = `${configContext.hostedExplorerURL}gallery.html?tab=${
        GalleryTab[galleryViewerProps.selectedTab]
      }`);
  }
  const hideInputs = notebookViewerProps.hideInputs;

  const notebookUrl = decodeURIComponent(notebookViewerProps.notebookUrl);

  const galleryItemId = notebookViewerProps.galleryItemId;
  let galleryItem: IGalleryItem;

  if (galleryItemId) {
    const junoClient = new JunoClient();
    const galleryItemJunoResponse = await junoClient.getNotebookInfo(galleryItemId);
    galleryItem = galleryItemJunoResponse.data;
  }

  // The main purpose of hiding the prompt is to hide everything when hiding inputs.
  // It is generally not very useful to just hide the prompt.
  const hidePrompts = hideInputs;

  render(notebookUrl, backNavigationText, hideInputs, hidePrompts, galleryItem, onBackClick);
};

const render = (
  notebookUrl: string,
  backNavigationText: string,
  hideInputs?: boolean,
  hidePrompts?: boolean,
  galleryItem?: IGalleryItem,
  onBackClick?: () => void,
) => {
  const props: NotebookViewerComponentProps = {
    junoClient: galleryItem ? new JunoClient() : undefined,
    notebookUrl,
    galleryItem,
    backNavigationText,
    hideInputs,
    hidePrompts,
    onBackClick: onBackClick,
    onTagClick: undefined,
  };

  if (galleryItem) {
    document.title = FileSystemUtil.stripExtension(galleryItem.name, "ipynb");
  }

  const element = (
    <>
      <header>
        <GalleryHeaderComponent />
      </header>
      <div style={{ marginLeft: 120, marginRight: 120 }}>
        <NotebookViewerComponent {...props} />
      </div>
    </>
  );

  ReactDOM.render(element, document.getElementById("notebookContent"));
};

// Entry point
window.addEventListener("load", onInit);
