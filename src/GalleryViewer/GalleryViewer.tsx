import * as ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.css";
import "./GalleryViewer.less";
import { GalleryViewerComponent } from "./GalleryViewerComponent";
import { JunoUtils } from "../Utils/JunoUtils";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";

const onInit = async () => {
  initializeIcons();
  const officialSamplesData = await JunoUtils.getOfficialSampleNotebooks();
  const galleryViewerComponent = new GalleryViewerComponent({
    officialSamplesData: officialSamplesData,
    likedNotebookData: undefined,
    container: undefined
  });
  ReactDOM.render(galleryViewerComponent.render(), document.getElementById("galleryContent"));
};

// Entry point
window.addEventListener("load", onInit);
