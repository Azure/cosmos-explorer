/**
 * Dynamic list:
 *
 * Creates a list of dynamic inputs that can be populated and deleted.
 *
 * How to use in your markup:
 * <dynamic-list params="{ listItems: anObservableArrayOfDynamicListItem, placeholder: 'Text to display in placeholder',  ariaLabel: 'Text for aria-label', buttonText: 'Add item' }">
 * </dynamic-list>
 *
 */

import * as ko from "knockout";
import { WaitsForTemplateViewModel } from "../../WaitsForTemplateViewModel";
import { KeyCodes } from "../../../Common/Constants";
import template from "./dynamic-list.html";

/**
 * Parameters for this component
 */
export interface DynamicListParams {
  /**
   * Observable list of items to update
   */
  listItems: ko.ObservableArray<DynamicListItem>;

  /**
   * Placeholder text to use on inputs
   */
  placeholder?: string;

  /**
   * Text to use as aria-label
   */
  ariaLabel: string;

  /**
   * Text for the button to add items
   */
  buttonText?: string;

  /**
   * Callback triggered when the template is bound to the component (for testing purposes)
   */
  onTemplateReady?: () => void;
}

/**
 * Item in the dynamic list
 */
export interface DynamicListItem {
  value: ko.Observable<string>;
}

export class DynamicListViewModel extends WaitsForTemplateViewModel {
  public placeholder: string;
  public ariaLabel: string;
  public buttonText: string;
  public newItem: ko.Observable<string>;
  public override isTemplateReady: ko.Observable<boolean>;
  public listItems: ko.ObservableArray<DynamicListItem>;

  public constructor(options: DynamicListParams) {
    super();
    super.onTemplateReady((isTemplateReady: boolean) => {
      if (isTemplateReady && options.onTemplateReady) {
        options.onTemplateReady();
      }
    });

    const params: DynamicListParams = options;
    const paramsPlaceholder: string = params.placeholder;
    const paramsButtonText: string = params.buttonText;
    this.placeholder = paramsPlaceholder || "Write a value";
    this.ariaLabel = "Unique keys";
    this.buttonText = paramsButtonText || "Add item";
    this.listItems = params.listItems || ko.observableArray<DynamicListItem>();
    this.newItem = ko.observable("");
  }

  public removeItem = (data: any, event: MouseEvent | KeyboardEvent): void => {
    const context = ko.contextFor(event.target as Node);
    this.listItems.splice(context.$index(), 1);
    document.getElementById("addUniqueKeyBtn").focus();
  };

  public onRemoveItemKeyPress = (data: any, event: KeyboardEvent, source: any): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.removeItem(data, event);
      (document.querySelector(".dynamicListItem:last-of-type input") as HTMLElement).focus();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  public addItem(): void {
    this.listItems.push({ value: ko.observable("") });
    (document.querySelector(".dynamicListItem:last-of-type input") as HTMLElement).focus();
  }

  public onAddItemKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.addItem();
      event.stopPropagation();
      return false;
    }
    return true;
  };
}

/**
 * Helper class for ko component registration
 */
export const DynamicListComponent = {
  viewModel: DynamicListViewModel,
  template,
};
