import React from "react";
import { ExecuteSprocResult } from "../../../Common/dataAccess/executeStoredProcedure";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { useTabs } from "../../../hooks/useTabs";
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
  public onUpdateClick: () => Promise<void>;

  constructor(
    options: ViewModels.ScriptTabOption,
    private props: IStoredProcTabProps,
  ) {
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
    useTabs.getState().activateTab(this);
    this.iStoreProcAccessor.onTabClickEvent();
  }

  public onCloseTabButtonClick(): void {
    useTabs.getState().closeTab(this);
  }

  public onExecuteSprocsResult(result: ExecuteSprocResult): void {
    this.iStoreProcAccessor.onExecuteSprocsResultEvent(result);
  }

  public onExecuteSprocsError(error: string): void {
    this.iStoreProcAccessor.onExecuteSprocsErrorEvent(error);
  }
}
