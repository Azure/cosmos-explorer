import * as React from "react";
import * as InputTypeaheadComponent from "../../Controls/InputTypeahead/InputTypeaheadComponent";
import CloseIcon from "../../../../images/close-black.svg";

export interface QueryContainerComponentProps {
  initialQuery: string;
  latestPartialQueries: InputTypeaheadComponent.Item[];
  onExecuteClick: (query: string) => void;
  isLoading: boolean;
  onIsValidQueryChange: (isValidQuery: boolean) => void;
}

interface QueryContainerComponentState {
  query: string;
}

export class QueryContainerComponent extends React.Component<
  QueryContainerComponentProps,
  QueryContainerComponentState
> {
  public constructor(props: QueryContainerComponentProps) {
    super(props);
    this.state = {
      query: this.props.initialQuery
    };
  }

  public render(): JSX.Element {
    return (
      <div className="queryContainer">
        <InputTypeaheadComponent.InputTypeaheadComponent
          defaultValue={this.state.query}
          showCancelButton={false}
          choices={this.props.latestPartialQueries}
          onNewValue={(val: string) => this.onNewValue(val)}
          placeholder='g.V().has("name", "value")'
          typeaheadOverrideOptions={{ dynamic: false }}
          showSearchButton={false}
          onSelected={(item: InputTypeaheadComponent.Item) => this.onNewValue(item.value)}
          submitFct={(inputValue: string, selection: InputTypeaheadComponent.Item) =>
            this.onSubmit(inputValue, selection)
          }
          useTextarea={true}
        />
        {this.renderQueryInputButton()}
      </div>
    );
  }

  private static isQueryValid(query: string) {
    return query.length > 0;
  }

  /**
   * InputValue takes precedence over dropdown selection
   * @param inputValue
   * @param selection
   */
  private onSubmit(inputValue: string, selection: InputTypeaheadComponent.Item) {
    let newValue = inputValue;
    if (selection && typeof newValue === "undefined") {
      newValue = selection.value;
    }
    this.onNewValue(newValue);
    if (QueryContainerComponent.isQueryValid(newValue)) {
      this.props.onExecuteClick(newValue);
    }
  }

  private onNewValue(newValue: string): void {
    this.setState({ query: newValue });
    this.props.onIsValidQueryChange(QueryContainerComponent.isQueryValid(newValue));
  }

  private onClearFilterClick(): void {
    this.setState({ query: "" });
  }

  private renderQueryInputButton(): JSX.Element {
    return (
      <React.Fragment>
        <button
          type="button"
          className="filterbtnstyle queryButton"
          onClick={e => this.props.onExecuteClick(this.state.query)}
          disabled={this.props.isLoading || !QueryContainerComponent.isQueryValid(this.state.query)}
        >
          Execute Gremlin Query
        </button>
        <span
          className="filterclose"
          role="button"
          tabIndex={0}
          onClick={() => this.onClearFilterClick()}
          onKeyPress={() => this.onClearFilterClick()}
          aria-label="Clear query"
        >
          <img className="refreshcol" src={CloseIcon} alt="Close" />
        </span>
      </React.Fragment>
    );
  }
}
