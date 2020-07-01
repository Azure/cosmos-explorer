import "bootstrap/dist/css/bootstrap.css";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import React from "react";
import * as ReactDOM from "react-dom";
import { initializeConfiguration } from "../Config";
import {
  NotebookViewerComponent,
  NotebookViewerComponentProps
} from "../Explorer/Controls/NotebookViewer/NotebookViewerComponent";
import { IGalleryItem, JunoClient } from "../Juno/JunoClient";
import * as GalleryUtils from "../Utils/GalleryUtils";

const onInit = async () => {
  initializeIcons();
  await initializeConfiguration();
  const galleryViewerProps = GalleryUtils.getGalleryViewerProps(window.location.search);
  const notebookViewerProps = GalleryUtils.getNotebookViewerProps(window.location.search);
  const backNavigationText = galleryViewerProps.selectedTab && GalleryUtils.getTabTitle(galleryViewerProps.selectedTab);

  const notebookUrl = decodeURIComponent(notebookViewerProps.notebookUrl);
  render(notebookUrl, backNavigationText);

  const galleryItemId = notebookViewerProps.galleryItemId;
  if (galleryItemId) {
    const junoClient = new JunoClient();
    const notebook = await junoClient.getNotebook(galleryItemId);
    render(notebookUrl, backNavigationText, notebook.data);
  }
};

const render = (notebookUrl: string, backNavigationText: string, galleryItem?: IGalleryItem) => {
  const props: NotebookViewerComponentProps = {
    junoClient: galleryItem ? new JunoClient() : undefined,
    notebookUrl,
    galleryItem,
    backNavigationText,
    onBackClick: undefined,
    onTagClick: undefined
  };

  ReactDOM.render(<NotebookViewerComponent {...props} />, document.getElementById("notebookContent"));
};

// Entry point
window.addEventListener("load", onInit);
