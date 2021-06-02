import { TriggerDefinition } from "@azure/cosmos";
import React from "react";
import * as ViewModels from "../../Contracts/ViewModels";
import { SqlTriggerResource } from "../../Utils/arm/generatedClients/cosmos/types";
import Explorer from "../Explorer";
import Trigger from "../Tree/Trigger";
import ScriptTabBase from "./ScriptTabBase";
import { TriggerTabContent } from "./TriggerTabContent";

interface ITriggerTabInstance {
  container: Explorer;
}

export default class TriggerTab extends ScriptTabBase {
  public onSaveClick: () => void;
  public onUpdateClick: () => Promise<void>;
  public collection: ViewModels.Collection;
  public node: Trigger;
  public triggerType: ViewModels.Editable<string>;
  public triggerOperation: ViewModels.Editable<string>;
  public triggerTypeInstance: ITriggerTabInstance;
  public triggerOptions: ViewModels.ScriptTabOption;

  constructor(options: ViewModels.ScriptTabOption, props: ITriggerTabInstance) {
    super(options);
    super.onActivate.bind(this);
    this.triggerTypeInstance = props;
    this.triggerOptions = options;
  }

  addNodeInCollection(createdResource: TriggerDefinition | SqlTriggerResource): void {
    this.node = this.collection.createTriggerNode(createdResource);
  }

  public render(): JSX.Element {
    return (
      <TriggerTabContent
        {...this}
        addNodeInCollection={(createdResource) => this.addNodeInCollection(createdResource)}
      />
    );
  }
}
