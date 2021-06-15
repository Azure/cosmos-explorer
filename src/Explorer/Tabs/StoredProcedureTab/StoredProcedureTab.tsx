import React from "react";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import StoredProcedure from "../../Tree/StoredProcedure";
import ScriptTabBase from "../ScriptTabBase";
import StoredProcedureTabComponent, {
  IStoredProcTabComponentProps,
  IStorProcTabComponentAccessor,
} from "./StoredProcedureTabComponent";

export interface IStoredProcTabProps {
  container: Explorer;
  collection: ViewModels.Collection;
}

export class NewStoredProcedureTab extends ScriptTabBase {
  public queryText: string;
  public currentQuery: string;
  public partitionKey: DataModels.PartitionKey;
  public iStoredProcTabComponentProps: IStoredProcTabComponentProps;
  public iStoreProcAccessor: IStorProcTabComponentAccessor;
  public node: StoredProcedure;
  public onSaveClick: () => void;
  //eslint-disable-next-line
  public onUpdateClick: () => Promise<any>;

  constructor(options: ViewModels.ScriptTabOption, private props: IStoredProcTabProps) {
    super(options);
    this.partitionKey = options.partitionKey;

    this.iStoredProcTabComponentProps = {
      resource: options.resource,
      isNew: options.isNew,
      tabKind: options.tabKind,
      title: options.title,
      tabPath: options.tabPath,
      collectionBase: options.collection,
      node: options.node,
      hasLocation: options.hashLocation,
      scriptTabBaseInstance: this,
      collection: props.collection,
      iStorProcTabComponentAccessor: (instance: IStorProcTabComponentAccessor) => {
        this.iStoreProcAccessor = instance;
      },
      container: props.container,
    };
  }

  public render(): JSX.Element {
    return <StoredProcedureTabComponent {...this.iStoredProcTabComponentProps} />;
  }

  public onTabClick(): void {
    this.manager?.activateTab(this);
    this.iStoreProcAccessor.onTabClickEvent();
  }

  public onCloseTabButtonClick(): void {
    this.manager?.closeTab(this);
  }

  //eslint-disable-next-line
  public onExecuteSprocsResult(result: any, logsData: any): void {
    this.iStoreProcAccessor.onExecuteSprocsResultEvent(result, logsData);
  }

  public onExecuteSprocsError(error: string): void {
    this.iStoreProcAccessor.onExecuteSprocsErrorEvent(error);
  }
}
