import * as ko from "knockout";
import * as _ from "underscore";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import { ContextualPaneBase } from "./ContextualPaneBase";

export interface ExecuteSprocParam {
  type: ko.Observable<string>;
  value: ko.Observable<string>;
}

type UnwrappedExecuteSprocParam = {
  type: string;
  value: any;
};

export class ExecuteSprocParamsPane extends ContextualPaneBase implements ViewModels.ExecuteSprocParamsPane {
  public params: ko.ObservableArray<ExecuteSprocParam>;
  public partitionKeyType: ko.Observable<string>;
  public partitionKeyValue: ko.Observable<string>;
  public collectionHasPartitionKey: ko.Observable<boolean>;
  public addNewParamLabel: string = "Add New Param";
  public executeButtonEnabled: ko.Computed<boolean>;

  private _selectedSproc: ViewModels.StoredProcedure;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title("Input parameters");
    this.partitionKeyType = ko.observable<string>("custom");
    this.partitionKeyValue = ko.observable<string>();
    this.executeButtonEnabled = ko.computed<boolean>(() => this.validPartitionKeyValue());
    this.params = ko.observableArray<ExecuteSprocParam>([
      { type: ko.observable<string>("string"), value: ko.observable<string>() }
    ]);
    this.collectionHasPartitionKey = ko.observable<boolean>();
    this.resetData();
  }

  public open() {
    super.open();
    const currentSelectedSproc: ViewModels.StoredProcedure =
      this.container && this.container.findSelectedStoredProcedure();
    if (!!currentSelectedSproc && !!this._selectedSproc && this._selectedSproc.rid !== currentSelectedSproc.rid) {
      this.params([]);
      this.partitionKeyValue("");
    }
    this._selectedSproc = currentSelectedSproc;
    this.collectionHasPartitionKey((this.container && !!this.container.findSelectedCollection().partitionKey) || false);
    const focusElement = document.getElementById("partitionKeyValue");
    focusElement && focusElement.focus();
  }

  public execute = () => {
    this.formErrors("");
    const partitionKeyValue: string = (() => {
      if (!this.collectionHasPartitionKey()) {
        return undefined;
      }

      const type: string = this.partitionKeyType();
      let value: string = this.partitionKeyValue();

      if (type === "custom") {
        if (value === "undefined" || value === undefined) {
          return undefined;
        }

        if (value === "null" || value === null) {
          return null;
        }

        try {
          value = JSON.parse(value);
        } catch (e) {
          this.formErrors(`Invalid param specified: ${value}`);
          this.formErrorsDetails(`Invalid param specified: ${value} is not a valid literal value`);
        }
      }

      return value;
    })();
    const unwrappedParams: UnwrappedExecuteSprocParam[] = ko.toJS(this.params());
    const wrappedSprocParams: UnwrappedExecuteSprocParam[] = !this.params()
      ? undefined
      : _.map(unwrappedParams, (unwrappedParam: UnwrappedExecuteSprocParam) => {
          let paramValue: string = unwrappedParam.value;

          if (unwrappedParam.type === "custom" && (paramValue === "undefined" || paramValue === "")) {
            paramValue = undefined;
          } else if (unwrappedParam.type === "custom") {
            try {
              paramValue = JSON.parse(paramValue);
            } catch (e) {
              this.formErrors(`Invalid param specified: ${paramValue}`);
              this.formErrorsDetails(`Invalid param specified: ${paramValue} is not a valid literal value`);
            }
          }

          unwrappedParam.value = paramValue;
          return unwrappedParam;
        });

    if (this.formErrors()) {
      return;
    }

    const sprocParams = wrappedSprocParams && _.pluck(wrappedSprocParams, "value");
    this._selectedSproc.execute(sprocParams, partitionKeyValue);
    this.close();
  };

  private validPartitionKeyValue = (): boolean => {
    return !this.collectionHasPartitionKey || (this.partitionKeyValue() != null && this.partitionKeyValue().length > 0);
  };

  public addNewParam = (): void => {
    this.params.push({ type: ko.observable<string>("string"), value: ko.observable<string>() });
    this._maintainFocusOnAddNewParamLink();
  };

  public onAddNewParamKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.addNewParam();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  public addNewParamAtIndex = (index: number): void => {
    this.params.splice(index, 0, { type: ko.observable<string>("string"), value: ko.observable<string>() });
  };

  public onAddNewParamAtIndexKeyPress = (index: number, source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.addNewParamAtIndex(index);
      event.stopPropagation();
      return false;
    }

    return true;
  };

  public deleteParam = (indexToRemove: number): void => {
    const params = _.reject(this.params(), (param: ExecuteSprocParam, index: number) => {
      return index === indexToRemove;
    });
    this.params(params);
  };

  public onDeleteParamKeyPress = (indexToRemove: number, source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.deleteParam(indexToRemove);
      event.stopPropagation();
      return false;
    }

    return true;
  };

  public close(): void {
    super.close();
    this.formErrors("");
    this.formErrorsDetails("");
  }

  private _maintainFocusOnAddNewParamLink(): void {
    const addNewParamLink = document.getElementById("addNewParamLink");
    addNewParamLink.scrollIntoView();
  }
}
