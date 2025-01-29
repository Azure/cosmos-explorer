import { Link, Text } from "@fluentui/react";
import "bootstrap/dist/css/bootstrap.css";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { userContext } from "UserContext";
import { initializeConfiguration } from "../ConfigContext";
import { GalleryHeaderComponent } from "../Explorer/Controls/Header/GalleryHeaderComponent";
import {
  GalleryAndNotebookViewerComponent,
  GalleryAndNotebookViewerComponentProps,
} from "../Explorer/Controls/NotebookGallery/GalleryAndNotebookViewerComponent";
import { GalleryTab, SortBy } from "../Explorer/Controls/NotebookGallery/GalleryViewerComponent";
import { JunoClient } from "../Juno/JunoClient";
import * as GalleryUtils from "../Utils/GalleryUtils";
import "./GalleryViewer.less";

const enableNotebooksUrl = "https://aka.ms/cosmos-enable-notebooks";
const createAccountUrl = "https://aka.ms/cosmos-create-account-portal";

const onInit = async () => {
  const dataExplorerUrl = new URL("./", window.location.href).href;

  // initializeIcons();
  await initializeConfiguration();
  const galleryViewerProps = GalleryUtils.getGalleryViewerProps(window.location.search);

  const props: GalleryAndNotebookViewerComponentProps = {
    junoClient: new JunoClient(),
    selectedTab:
      galleryViewerProps.selectedTab ||
      (userContext.features.publicGallery ? GalleryTab.PublicGallery : GalleryTab.OfficialSamples),
    sortBy: galleryViewerProps.sortBy || SortBy.MostRecent,
    searchText: galleryViewerProps.searchText,
  };

  const element = (
    <div className="standalone-gallery-root">
      <header>
        <GalleryHeaderComponent />
      </header>
      <div style={{ margin: "auto", width: "85%" }}>
        <div style={{ paddingLeft: 26, paddingRight: 26, paddingTop: 20 }}>
          <Text block>
            Welcome to the Azure Cosmos DB notebooks gallery! View the sample notebooks to learn about use cases, best
            practices, and how to get started with Azure Cosmos DB.
          </Text>
          <Text styles={{ root: { marginTop: 10 } }} block>
            If {`you'd`} like to run or edit the notebook in your own Azure Cosmos DB account,{" "}
            <Link href={dataExplorerUrl}>sign in</Link> and select an account with{" "}
            <Link href={enableNotebooksUrl}>notebooks enabled</Link>. From there, you can download the sample to your
            account. If you {`don't`} have an account yet, you can{" "}
            <Link href={createAccountUrl}>create one from the Azure portal</Link>.
          </Text>
        </div>

        <GalleryAndNotebookViewerComponent {...props} />
      </div>
    </div>
  );

  ReactDOM.render(element, document.getElementById("galleryContent"));
};

// Entry point
window.addEventListener("load", onInit);
