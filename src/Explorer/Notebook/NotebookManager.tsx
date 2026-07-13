/*
 * Contains all notebook related stuff meant to be dynamically loaded by explorer
 */

import { JunoClient } from "../../Juno/JunoClient";
import { userContext } from "../../UserContext";
import Explorer from "../Explorer";
import { ResourceTreeAdapter } from "../Tree/ResourceTreeAdapter";
import { NotebookContainerClient } from "./NotebookContainerClient";

export interface NotebookManagerOptions {
  container: Explorer;
  resourceTree: ResourceTreeAdapter;
  refreshCommandBarButtons: () => void;
  refreshNotebookList: () => void;
}

export default class NotebookManager {
  private params: NotebookManagerOptions;
  public junoClient: JunoClient;

  public notebookClient: NotebookContainerClient;

  public initialize(params: NotebookManagerOptions): void {
    this.params = params;
    this.junoClient = new JunoClient();

    this.notebookClient = new NotebookContainerClient(() =>
      this.params.container.initNotebooks(userContext?.databaseAccount),
    );
  }
}
