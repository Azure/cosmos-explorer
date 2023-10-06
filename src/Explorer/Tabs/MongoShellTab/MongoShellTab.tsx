import React from "react";
import * as DataModels from "../../../Contracts/DataModels";
import type { TabOptions } from "../../../Contracts/ViewModels";
import { useTabs } from "../../../hooks/useTabs";
import Explorer from "../../Explorer";
import TabsBase from "../TabsBase";
import MongoShellTabComponent, { IMongoShellTabAccessor, IMongoShellTabComponentProps } from "./MongoShellTabComponent";

export interface IMongoShellTabProps {
  container: Explorer;
}

export class NewMongoShellTab extends TabsBase {
  public queryText: string;
  public currentQuery: string;
  public partitionKey: DataModels.PartitionKey;
  public iMongoShellTabComponentProps: IMongoShellTabComponentProps;
  public iMongoShellTabAccessor: IMongoShellTabAccessor;

  constructor(
    options: TabOptions,
    private props: IMongoShellTabProps,
  ) {
    super(options);
    this.iMongoShellTabComponentProps = {
      collection: this.collection,
      tabsBaseInstance: this,
      container: this.props.container,
      onMongoShellTabAccessor: (instance: IMongoShellTabAccessor) => {
        this.iMongoShellTabAccessor = instance;
      },
    };
  }

  public render(): JSX.Element {
    return <MongoShellTabComponent {...this.iMongoShellTabComponentProps} />;
  }

  public onTabClick(): void {
    useTabs.getState().activateTab(this);
    this.iMongoShellTabAccessor.onTabClickEvent();
  }
}
