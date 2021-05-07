/**
 * How to use this component:
 *
 * In your html markup, use:
 * <input-typeahead params="{
                                    choices:choices,
                                    selection:selection,
                                    inputValue:inputValue,
                                    placeholder:'Enter source',
                                    typeaheadOverrideOptions:typeaheadOverrideOptions
                                }"></input-typeahead>
 * The parameters are documented below.
 *
 * Notes:
 * - dynamic:true by default, this allows choices to change after initialization.
 *   To turn it off, use:
 *   typeaheadOverrideOptions: { dynamic:false }
 *
 */

import "jquery-typeahead";
import template from "./input-typeahead.html";

/**
 * Helper class for ko component registration
 */
export class InputTypeaheadComponent {
  constructor() {
    return {
      viewModel: InputTypeaheadViewModel,
      template,
    };
  }
}

export interface Item {
  caption: string;
  value: any;
}

/**
 * Parameters for this component
 */
interface InputTypeaheadParams {
  /**
   * List of choices available in the dropdown.
   */
  choices: ko.ObservableArray<Item>;

  /**
   * Gets updated when user clicks on the choice in the dropdown
   */
  selection?: ko.Observable<Item>;

  /**
   * The current string value of <input>
   */
  inputValue?: ko.Observable<string>;

  /**
   * Define what text you want as the input placeholder
   */
  placeholder: string;

  /**
   * Override default jquery-typeahead options
   * WARNING: do not override input, source or callback to avoid breaking the components behavior.
   */
  typeaheadOverrideOptions?: any;

  /**
   * This function gets called when pressing ENTER on the input box
   */
  submitFct?: (inputValue: string | null, selection: Item | null) => void;

  /**
   * Typehead comes with a Search button that we normally remove.
   * If you want to use it, turn this on
   */
  showSearchButton?: boolean;
}

interface OnClickItem {
  matchedKey: string;
  value: any;
  caption: string;
  group: string;
}

interface Cache {
  inputValue: string | null;
  selection: Item | null;
}

class InputTypeaheadViewModel {
  private static instanceCount = 0; // Generate unique id for each component's typeahead instance
  private instanceNumber: number;
  private params: InputTypeaheadParams;

  private cache: Cache;

  public constructor(params: InputTypeaheadParams) {
    this.instanceNumber = InputTypeaheadViewModel.instanceCount++;
    this.params = params;

    this.params.choices.subscribe(this.initializeTypeahead.bind(this));
    this.cache = {
      inputValue: null,
      selection: null,
    };
  }

  /**
   * Must execute once ko is rendered, so that it can find the input element by id
   */
  private initializeTypeahead() {
    let params = this.params;
    let cache = this.cache;
    let options: any = {
      input: `#${this.getComponentId()}`, //'.input-typeahead',
      order: "asc",
      minLength: 0,
      searchOnFocus: true,
      source: {
        display: "caption",
        data: () => {
          return this.params.choices();
        },
      },
      callback: {
        onClick: (_node: unknown, _a: unknown, item: OnClickItem) => {
          cache.selection = item;

          if (params.selection) {
            params.selection(item);
          }
        },
        onResult(_node: unknown, query: any) {
          cache.inputValue = query;
          if (params.inputValue) {
            params.inputValue(query);
          }
        },
      },
      template: (_query: string, item: any) => {
        // Don't display id if caption *IS* the id
        return item.caption === item.value
          ? "<span>{{caption}}</span>"
          : "<span><div>{{caption}}</div><div><small>{{value}}</small></div></span>";
      },
      dynamic: true,
    };

    // Override options
    if (params.typeaheadOverrideOptions) {
      for (let p in params.typeaheadOverrideOptions) {
        options[p] = params.typeaheadOverrideOptions[p];
      }
    }

    ($ as any).typeahead(options);
  }

  /**
   * Get this component id
   * @return unique id per instance
   */
  private getComponentId(): string {
    return `input-typeahead${this.instanceNumber}`;
  }

  /**
   * Executed once ko is done rendering bindings
   * Use ko's "template: afterRender" callback to do that without actually using any template.
   * Another way is to call it within setTimeout() in constructor.
   */
  public afterRender(): void {
    this.initializeTypeahead();
  }

  public submit(): void {
    if (this.params.submitFct) {
      this.params.submitFct(this.cache.inputValue, this.cache.selection);
    }
  }
}
