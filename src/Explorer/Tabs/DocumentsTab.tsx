import * as ko from "knockout";
import React from "react";
import "react-splitter-layout/lib/index.css";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import DocumentsTabContent from "./DocumentsTabContent";
import TabsBase from "./TabsBase";

export default class DocumentsTab extends TabsBase {
  public documentContentsGridId: string;
  public documentContentsContainerId: string;
  public displayedError: ko.Observable<string>;
  public partitionKey: DataModels.PartitionKey;
  public partitionKeyPropertyHeader: string;
  public partitionKeyProperty: string;
  public _resourceTokenPartitionKey: string;

  constructor(options: ViewModels.DocumentsTabOptions) {
    super(options);
    this.documentContentsGridId = `documentContentsGrid${this.tabId}`;
    this.documentContentsContainerId = `documentContentsContainer${this.tabId}`;
    this.partitionKey = options.partitionKey || (this.collection && this.collection.partitionKey);
    this._resourceTokenPartitionKey = options.resourceTokenPartitionKey;

    this.partitionKeyPropertyHeader =
      (this.collection && this.collection.partitionKeyPropertyHeader) || this._getPartitionKeyPropertyHeader();
    this.partitionKeyProperty = this.partitionKeyPropertyHeader
      ? this.partitionKeyPropertyHeader.replace(/[/]+/g, ".").substr(1).replace(/[']+/g, "")
      : undefined;

    this.displayedError = ko.observable<string>("");
  }

  public onTabClick(): void {
    super.onTabClick();
    this.collection && this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
  }

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }

  private _getPartitionKeyPropertyHeader(): string {
    return this.partitionKey?.paths?.[0];
  }

  render(): JSX.Element {
    return <DocumentsTabContent {...this} />;
  }
}
