import * as ko from "knockout";
import { KeyCodes } from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import Explorer from "../Explorer";
import { ContextualPaneBase } from "./ContextualPaneBase";

export default class NewVertexPane extends ContextualPaneBase {
  public container: Explorer;
  public visible: ko.Observable<boolean>;
  public formErrors: ko.Observable<string>;
  public formErrorsDetails: ko.Observable<string>;

  // Graph style stuff
  public tempVertexData: ko.Observable<ViewModels.NewVertexData>; // vertex data being edited
  private onSubmitCreateCallback: (newVertexData: ViewModels.NewVertexData) => void;
  private partitionKeyProperty: ko.Observable<string>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.tempVertexData = ko.observable<ViewModels.NewVertexData>(null);
    this.partitionKeyProperty = ko.observable(null);
    this.resetData();
  }

  public submit() {
    // Commit edited changes
    if (this.onSubmitCreateCallback != null) {
      this.onSubmitCreateCallback(this.tempVertexData());
    }

    // this.close();
  }

  public resetData() {
    super.resetData();

    this.onSubmitCreateCallback = null;

    this.tempVertexData({
      label: "",
      properties: <ViewModels.InputProperty[]>[],
    });
    this.partitionKeyProperty(null);
  }

  public subscribeOnSubmitCreate(callback: (newVertexData: ViewModels.NewVertexData) => void): void {
    this.onSubmitCreateCallback = callback;
  }

  public setPartitionKeyProperty(pKeyProp: string): void {
    this.partitionKeyProperty(pKeyProp);
  }

  public onMoreDetailsKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Space || event.keyCode === KeyCodes.Enter) {
      this.showErrorDetails();
      return false;
    }
    return true;
  };

  public buildString = (prefix: string, index: number): string => {
    return `${prefix}${index}`;
  };
}
