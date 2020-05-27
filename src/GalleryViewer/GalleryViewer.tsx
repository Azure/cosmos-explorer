import * as ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.css";
import { CosmosClient } from "../Common/CosmosClient";
import { GalleryViewerComponent } from "../Explorer/Controls/NotebookGallery/GalleryViewerComponent";
import { JunoUtils } from "../Utils/JunoUtils";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";

const onInit = async () => {
  initializeIcons();
  const officialSamplesData = await JunoUtils.getOfficialSampleNotebooks(CosmosClient.authorizationToken());
  const galleryViewerComponent = new GalleryViewerComponent({
    officialSamplesData: officialSamplesData,
    likedNotebookData: undefined,
    container: undefined
  });
  ReactDOM.render(galleryViewerComponent.render(), document.getElementById("galleryContent"));
};

// Entry point
window.addEventListener("load", onInit);
