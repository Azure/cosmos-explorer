import React from "react";
import * as ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.css";
import { NotebookMetadata } from "../../../Contracts/DataModels";
import { NotebookViewerComponent } from "./NotebookViewerComponent";
import { SessionStorageUtility, StorageKey } from "../../../Shared/StorageUtility";

const getNotebookUrl = (): string => {
  const regex: RegExp = new RegExp("[?&]notebookurl=([^&#]*)|&|#|$");
  const results: RegExpExecArray | null = regex.exec(window.location.href);
  if (!results || !results[1]) {
    return "";
  }

  return decodeURIComponent(results[1]);
};

const onInit = async () => {
  var notebookMetadata: NotebookMetadata;
  const notebookMetadataString = SessionStorageUtility.getEntryString(StorageKey.NotebookMetadata);
  const notebookName = SessionStorageUtility.getEntryString(StorageKey.NotebookName);

  if (notebookMetadataString == "null" || notebookMetadataString != null) {
    notebookMetadata = (await JSON.parse(notebookMetadataString)) as NotebookMetadata;
    SessionStorageUtility.removeEntry(StorageKey.NotebookMetadata);
    SessionStorageUtility.removeEntry(StorageKey.NotebookName);
  }

  const notebookViewerComponent = (
    <NotebookViewerComponent
      notebookMetadata={notebookMetadata}
      notebookName={notebookName}
      notebookUrl={getNotebookUrl()}
      container={null}
    />
  );
  ReactDOM.render(notebookViewerComponent, document.getElementById("notebookContent"));
};

// Entry point
window.addEventListener("load", onInit);
