import * as ko from "knockout";

import * as DateTimeUtilities from "../../Tables/QueryBuilder/DateTimeUtilities";
import * as EntityPropertyNameValidator from "./Validators/EntityPropertyNameValidator";
import EntityPropertyValueValidator from "./Validators/EntityPropertyValueValidator";
import * as Constants from "../../Tables/Constants";
import * as Utilities from "../../Tables/Utilities";
import TableEntityPane from "./TableEntityPane";

export interface IValidationResult {
  isInvalid: boolean;
  help: string;
}

export interface IActionEnabledDialog {
  updateIsActionEnabled: () => void;
}

/**
 * View model for an entity proprety
 */
export default class EntityPropertyViewModel {
  /* Constants */
  public static noTooltip = "";
  // Maximum number of custom properties, see Azure Service Data Model
  // At https://msdn.microsoft.com/library/azure/dd179338.aspx
  public static maximumNumberOfProperties = 252;

  // Labels
  public closeButtonLabel: string = "Close"; // localize

  /* Observables */
  public name: ko.Observable<string>;
  public type: ko.Observable<string>;
  public value: ko.Observable<any>;
  public inputType: ko.Computed<string>;

  public nameTooltip: ko.Observable<string>;
  public isInvalidName: ko.Observable<boolean>;

  public valueTooltip: ko.Observable<string>;
  public isInvalidValue: ko.Observable<boolean>;

  public namePlaceholder: ko.Observable<string>;
  public valuePlaceholder: ko.Observable<string>;

  public hasFocus: ko.Observable<boolean>;
  public valueHasFocus: ko.Observable<boolean>;
  public isDateType: ko.Computed<boolean>;

  public editable: boolean; // If a property's name or type is editable, these two are always the same regarding editability.
  public valueEditable: boolean; // If a property's value is editable, could be different from name or type.
  public removable: boolean; // If a property is removable, usually, PartitionKey, RowKey and TimeStamp (if applicable) are not removable.
  public isRequired: boolean; // If a property's value is required, used to differentiate the place holder label.
  public ignoreEmptyValue: boolean;

  /* Members */
  private tableEntityPane: TableEntityPane;
  private _validator: EntityPropertyValueValidator;

  constructor(
    tableEntityPane: TableEntityPane,
    name: string,
    type: string,
    value: any,
    namePlaceholder: string = "",
    valuePlaceholder: string = "",
    editable: boolean = false,
    defaultValidName: boolean = true,
    defaultValidValue: boolean = false,
    isRequired: boolean = false,
    removable: boolean = editable,
    valueEditable: boolean = editable,
    ignoreEmptyValue: boolean = false
  ) {
    this.name = ko.observable<string>(name);
    this.type = ko.observable<string>(type);
    this.isDateType = ko.pureComputed<boolean>(() => this.type() === Constants.TableType.DateTime);
    if (this.isDateType()) {
      value = value ? DateTimeUtilities.getLocalDateTime(value) : value;
    }
    this.value = ko.observable(value);
    this.inputType = ko.pureComputed<string>(() => {
      if (!this.valueHasFocus() && !this.value() && this.isDateType()) {
        return Constants.InputType.Text;
      }
      return Utilities.getInputTypeFromDisplayedName(this.type());
    });

    this.namePlaceholder = ko.observable<string>(namePlaceholder);
    this.valuePlaceholder = ko.observable<string>(valuePlaceholder);

    this.editable = editable;
    this.isRequired = isRequired;
    this.removable = removable;
    this.valueEditable = valueEditable;

    this._validator = new EntityPropertyValueValidator(isRequired);

    this.tableEntityPane = tableEntityPane;

    this.nameTooltip = ko.observable<string>(EntityPropertyViewModel.noTooltip);
    this.isInvalidName = ko.observable<boolean>(!defaultValidName);
    this.name.subscribe((name: string) => this.validateName(name));
    if (!defaultValidName) {
      this.validateName(name);
    }

    this.valueTooltip = ko.observable<string>(EntityPropertyViewModel.noTooltip);
    this.isInvalidValue = ko.observable<boolean>(!defaultValidValue);
    this.value.subscribe((value: string) => this.validateValue(value, this.type()));
    if (!defaultValidValue) {
      this.validateValue(value, type);
    }

    this.type.subscribe((type: string) => this.validateValue(this.value(), type));

    this.hasFocus = ko.observable<boolean>(false);
    this.valueHasFocus = ko.observable<boolean>(false);
  }

  /**
   * Gets the Javascript value of the entity property based on its EDM type.
   */
  public getPropertyValue(): any {
    var value: string = this.value();
    if (this.type() === Constants.TableType.DateTime) {
      value = DateTimeUtilities.getUTCDateTime(value);
    }
    return this._validator.parseValue(value, this.type());
  }

  private validateName(name: string): void {
    var result: IValidationResult = this.isInvalidNameInput(name);

    this.isInvalidName(result.isInvalid);
    this.nameTooltip(result.help);
    this.namePlaceholder(result.help);
    this.tableEntityPane.updateIsActionEnabled();
  }

  private validateValue(value: string, type: string): void {
    var result: IValidationResult = this.isInvalidValueInput(value, type);
    if (!result) {
      return;
    }

    this.isInvalidValue(result.isInvalid);
    this.valueTooltip(result.help);
    this.valuePlaceholder(result.help);
    this.tableEntityPane.updateIsActionEnabled();
  }

  private isInvalidNameInput(name: string): IValidationResult {
    return EntityPropertyNameValidator.validate(name);
  }

  private isInvalidValueInput(value: string, type: string): IValidationResult {
    if (this.ignoreEmptyValue && this.value() === "") {
      return { isInvalid: false, help: "" };
    }
    return this._validator.validate(value, type);
  }
}
