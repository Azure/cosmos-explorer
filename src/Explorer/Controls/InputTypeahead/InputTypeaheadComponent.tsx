/**
 *
 * Notes:
 * - dynamic:true by default, this allows choices to change after initialization.
 *   To turn it off, use:
 *   typeaheadOverrideOptions: { dynamic:false }
 *
 */
import { getTheme, IconButton, IIconProps, List, Stack, TextField } from "@fluentui/react";
import * as React from "react";
import "./InputTypeahead.less";

export interface Item {
  caption: string;
  value: string;
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
  onNewValue: (newValue?: string) => void;
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
  submitFct?: (inputValue?: string, selection?: Item) => void;

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

interface InputTypeaheadComponentState {
  isSuggestionVisible: boolean;
  selectedChoice?: Item;
  filteredChoices: Item[];
}

export class InputTypeaheadComponent extends React.Component<
  InputTypeaheadComponentProps,
  InputTypeaheadComponentState
> {
  constructor(props: InputTypeaheadComponentProps) {
    super(props);
    this.state = {
      isSuggestionVisible: false,
      filteredChoices: [],
      selectedChoice: {
        caption: "",
        value: "",
      },
    };
  }

  private onRenderCell = (item?: Item): JSX.Element => {
    return (
      <div className="input-typeahead-chocies-container" onClick={() => this.onChoiceClick(item)}>
        <p className="choice-caption">{item?.caption}</p>
        <span>{item?.value}</span>
      </div>
    );
  };

  private onChoiceClick = (item?: Item): void => {
    this.props.onNewValue(item?.caption);
    this.setState({ isSuggestionVisible: false, selectedChoice: item });
  };

  private handleChange = (value?: string): void => {
    if (!value) {
      this.setState({ isSuggestionVisible: true });
    }
    this.props.onNewValue(value);
    const filteredChoices = this.filterChoiceByValue(this.props.choices, value);
    this.setState({ filteredChoices });
  };

  private onSubmit = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Enter") {
      if (this.props.submitFct) {
        event.preventDefault();
        event.stopPropagation();
        this.props.submitFct(this.props.defaultValue, this.state.selectedChoice);
        this.setState({ isSuggestionVisible: false });
      }
    }
  };

  private filterChoiceByValue = (choices: Item[], searchKeyword?: string): Item[] => {
    return choices.filter((choice) =>
      // @ts-ignore
      Object.keys(choice).some((key) => choice[key].toLowerCase().includes(searchKeyword.toLowerCase())),
    );
  };

  public render(): JSX.Element {
    const { defaultValue, useTextarea, placeholder, onNewValue, submitFct } = this.props;
    const { isSuggestionVisible, selectedChoice, filteredChoices } = this.state;
    const theme = getTheme();

    const iconButtonStyles = {
      root: {
        color: theme.palette.neutralPrimary,
        marginLeft: "10px !important",
        marginTop: "0px",
        marginRight: "2px",
        width: "42px",
      },
      rootHovered: {
        color: theme.palette.neutralDark,
      },
    };
    const cancelIcon: IIconProps = { iconName: "cancel" };
    const searchIcon: IIconProps = { iconName: "Search" };

    return (
      <div className="input-typeahead-container">
        <Stack horizontal>
          <form aria-labelledby="input" className="input-query-form">
            <TextField
              multiline={useTextarea}
              rows={1}
              id="input"
              defaultValue={defaultValue}
              ariaLabel="Input query"
              placeholder={placeholder}
              className="input-type-head-text-field"
              value={defaultValue}
              onKeyDown={this.onSubmit}
              onFocus={() => this.setState({ isSuggestionVisible: true })}
              onChange={(_event, newValue?: string) => this.handleChange(newValue)}
            />
          </form>
          {this.props.showCancelButton && (
            <IconButton
              styles={iconButtonStyles}
              iconProps={cancelIcon}
              ariaLabel="cancel Button"
              onClick={() => onNewValue("")}
            />
          )}
          {this.props.showSearchButton && (
            <IconButton
              styles={iconButtonStyles}
              iconProps={searchIcon}
              ariaLabel="Search Button"
              onClick={() => submitFct && submitFct(defaultValue, selectedChoice)}
            />
          )}
        </Stack>
        {filteredChoices.length && isSuggestionVisible ? (
          <List items={filteredChoices} onRenderCell={this.onRenderCell} />
        ) : undefined}
      </div>
    );
  }
}
