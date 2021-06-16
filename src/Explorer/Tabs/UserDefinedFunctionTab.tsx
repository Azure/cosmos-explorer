import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import React from "react";
import * as ViewModels from "../../Contracts/ViewModels";
import UserDefinedFunction from "../Tree/UserDefinedFunction";
import ScriptTabBase from "./ScriptTabBase";
import UserDefinedFunctionTabContent from "./UserDefinedFunctionTabContent";

export default class UserDefinedFunctionTab extends ScriptTabBase {
  public onSaveClick: () => Promise<void>;
  public onUpdateClick: () => Promise<void>;
  public collection: ViewModels.Collection;
  public node: UserDefinedFunction;
  constructor(options: ViewModels.ScriptTabOption) {
    super(options);
    this.ariaLabel("User Defined Function Body");
    super.onActivate.bind(this);
    super.buildCommandBarOptions.bind(this);
    super.buildCommandBarOptions();
  }

  addNodeInCollection(createdResource: Resource & UserDefinedFunctionDefinition): void {
    this.node = this.collection.createUserDefinedFunctionNode(createdResource);
  }

  updateNodeInCollection(updateResource: Resource & UserDefinedFunctionDefinition): void {
    this.node.id(updateResource.id);
    this.node.body(updateResource.body as string);
  }

  render(): JSX.Element {
    return (
      <UserDefinedFunctionTabContent
        {...this}
        addNodeInCollection={(createdResource) => this.addNodeInCollection(createdResource)}
        updateNodeInCollection={(updateResource: Resource & UserDefinedFunctionDefinition) => this.updateNodeInCollection(updateResource)}
      />
    );
  }
}
