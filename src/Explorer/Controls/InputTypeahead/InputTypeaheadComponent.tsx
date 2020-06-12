/**
 *
 * Notes:
 * - dynamic:true by default, this allows choices to change after initialization.
 *   To turn it off, use:
 *   typeaheadOverrideOptions: { dynamic:false }
 *
 */
import * as React from "react";
import "../../../../externals/jquery.typeahead.min.js";
import "./InputTypeahead.less";
import { KeyCodes } from "../../../Common/Constants";

export interface Item {
  caption: string;
  value: any;
}

/**
 * Parameters for this component
 */
export interface InputTypeaheadComponentProps {
  /**
   * List of choices available in the dropdown.
   */
  choices: Item[];

  /**
   * Gets updated when user clicks on the choice in the dropdown
   */
  onSelected?: (selected: Item) => void;
  // selection?: ko.Observable<Item>;

  /**
   * The current string value of <input>
   */
  onNewValue?: (newValue: string) => void;
  // inputValue?:ko.Observable<string>;

  /**
   * Initial value of the input
   */
  defaultValue?: string;

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
  submitFct?: (inputValue: string, selection: Item) => void;

  /**
   * Typehead comes with a Search button that we normally remove.
   * If you want to use it, turn this on
   */
  showSearchButton?: boolean;

  /**
   * true: show (X) button that clears the text inside the textbox when typing
   */
  showCancelButton?: boolean;

  /**
   * true: use <textarea /> instead of <input />
   */
  useTextarea?: boolean;
}

interface OnClickItem {
  matchedKey: string;
  value: any;
  caption: string;
  group: string;
}

interface Cache {
  inputValue: string;
  selection: Item;
}

interface InputTypeaheadComponentState {}

export class InputTypeaheadComponent extends React.Component<
  InputTypeaheadComponentProps,
  InputTypeaheadComponentState
> {
  private inputElt: HTMLElement;
  private containerElt: HTMLElement;

  private cache: Cache;
  private inputValue: string;
  private selection: Item;

  public constructor(props: InputTypeaheadComponentProps) {
    super(props);
    this.cache = {
      inputValue: null,
      selection: null
    };
  }

  /**
   * Props have changed
   * @param prevProps
   * @param prevState
   * @param snapshot
   */
  public componentDidUpdate(
    prevProps: InputTypeaheadComponentProps,
    prevState: InputTypeaheadComponentState,
    snapshot: any
  ): void {
    if (prevProps.defaultValue !== this.props.defaultValue) {
      $(this.inputElt).val(this.props.defaultValue);
      this.initializeTypeahead();
    }
  }

  /**
   * Executed once react is done building the DOM for this component
   */
  public componentDidMount(): void {
    this.initializeTypeahead();
  }

  public render(): JSX.Element {
    return (
      <span className="input-typeahead-container">
        <div
          className="input-typehead"
          onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => this.onKeyDown(event)}
        >
          <div className="typeahead__container" ref={input => (this.containerElt = input)}>
            <div className="typeahead__field">
              <span className="typeahead__query">
                {this.props.useTextarea ? (
                  <textarea
                    rows={1}
                    name="q"
                    autoComplete="off"
                    aria-label="Input query"
                    ref={input => (this.inputElt = input)}
                    defaultValue={this.props.defaultValue}
                  />
                ) : (
                  <input
                    name="q"
                    type="search"
                    autoComplete="off"
                    aria-label="Input query"
                    ref={input => (this.inputElt = input)}
                    defaultValue={this.props.defaultValue}
                  />
                )}
              </span>
              {this.props.showSearchButton && (
                <span className="typeahead__button">
                  <button type="submit">
                    <span className="typeahead__search-icon" />
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </span>
    );
  }

  private onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.keyCode === KeyCodes.Enter) {
      if (this.props.submitFct) {
        event.preventDefault();
        event.stopPropagation();
        this.props.submitFct(this.cache.inputValue, this.cache.selection);
        $(this.containerElt)
          .children(".typeahead__result")
          .hide();
      }
    }
  }

  /**
   * Must execute once ko is rendered, so that it can find the input element by id
   */
  private initializeTypeahead(): void {
    const props = this.props;
    let cache = this.cache;
    let options: any = {
      input: this.inputElt,
      order: "asc",
      minLength: 0,
      searchOnFocus: true,
      source: {
        display: "caption",
        data: () => {
          return props.choices;
        }
      },
      callback: {
        onClick: (node: any, a: any, item: OnClickItem, event: any) => {
          cache.selection = item;

          if (props.onSelected) {
            props.onSelected(item);
          }
        },
        onResult(node: any, query: any, result: any, resultCount: any, resultCountPerGroup: any) {
          cache.inputValue = query;
          if (props.onNewValue) {
            props.onNewValue(query);
          }
        }
      },
      template: (query: string, item: any) => {
        // Don't display id if caption *IS* the id
        return item.caption === item.value
          ? "<span>{{caption}}</span>"
          : "<span><div>{{caption}}</div><div><small>{{value}}</small></div></span>";
      },
      dynamic: true
    };

    // Override options
    if (props.typeaheadOverrideOptions) {
      for (const p in props.typeaheadOverrideOptions) {
        options[p] = props.typeaheadOverrideOptions[p];
      }
    }

    if (props.hasOwnProperty("showCancelButton")) {
      options.cancelButton = props.showCancelButton;
    }

    $(this.inputElt).typeahead(options);
  }
}
