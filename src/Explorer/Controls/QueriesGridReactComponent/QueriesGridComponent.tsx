import {
  ContextualMenu,
  DetailsList,
  DetailsListLayoutMode,
  DetailsRow,
  FocusZone,
  IButtonProps,
  IColumn,
  IconButton,
  IContextualMenuProps,
  IDetailsListProps,
  IDetailsRowProps,
  IObjectWithKey,
  ISelectionZoneProps,
  ITextField,
  ITextFieldProps,
  Selection,
  SelectionMode,
  SelectionZone,
  TextField,
} from "@fluentui/react";
import * as React from "react";
import * as _ from "underscore";
import SaveQueryBannerIcon from "../../../../images/save_query_banner.png";
import * as Constants from "../../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { QueriesClient } from "../../../Common/QueriesClient";
import { StyleConstants } from "../../../Common/StyleConstants";
import * as DataModels from "../../../Contracts/DataModels";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { useDialog } from "../Dialog";

const title = "Open Saved Queries";

export interface QueriesGridComponentProps {
  queriesClient: QueriesClient;
  onQuerySelect: (query: DataModels.Query) => void;
  containerVisible: boolean;
  saveQueryEnabled: boolean;
}

export interface QueriesGridComponentState {
  queries: Query[];
  filteredResults: Query[];
}

interface Query extends DataModels.Query, IObjectWithKey {
  key: string;
}

export class QueriesGridComponent extends React.Component<QueriesGridComponentProps, QueriesGridComponentState> {
  private selection: Selection;
  private queryFilter: ITextField;

  constructor(props: QueriesGridComponentProps) {
    super(props);
    this.state = {
      queries: [],
      filteredResults: [],
    };
    this.selection = new Selection();
    this.selection.setItems(this.state.filteredResults);
  }

  public componentDidUpdate(prevProps: QueriesGridComponentProps, prevState: QueriesGridComponentState): void {
    this.selection.setItems(
      this.state.filteredResults,
      !_.isEqual(prevState.filteredResults, this.state.filteredResults),
    );
    this.queryFilter && this.queryFilter.focus();
    const querySetupCompleted: boolean = !prevProps.saveQueryEnabled && this.props.saveQueryEnabled;
    const noQueryFiltersApplied: boolean = !this.queryFilter || !this.queryFilter.value;
    if (!this.props.containerVisible || !this.props.saveQueryEnabled) {
      return;
    } else if (noQueryFiltersApplied && (!prevProps.containerVisible || querySetupCompleted)) {
      // refresh only when pane is opened or query setup was recently completed
      this.fetchSavedQueries();
    }
  }

  // fetched saved queries when panel open
  public componentDidMount() {
    this.fetchSavedQueries();
  }

  public render(): JSX.Element {
    if (this.state.queries.length === 0) {
      return this.renderBannerComponent();
    }
    return this.renderQueryGridComponent();
  }

  private renderQueryGridComponent(): JSX.Element {
    const searchFilterProps: ITextFieldProps = {
      placeholder: "Search for Queries",
      ariaLabel: "Query filter input",
      onChange: this.onFilterInputChange,
      componentRef: (queryInput: ITextField) => (this.queryFilter = queryInput),
      styles: {
        root: { paddingBottom: "12px" },
        field: { fontSize: `${StyleConstants.mediumFontSize}px` },
      },
    };
    const selectionContainerProps: ISelectionZoneProps = {
      selection: this.selection,
      selectionMode: SelectionMode.single,
      onItemInvoked: (item: Query) => this.props.onQuerySelect(item),
    };
    const detailsListProps: IDetailsListProps = {
      items: this.state.filteredResults,
      columns: this.getColumns(),
      isHeaderVisible: false,
      setKey: "queryName",
      layoutMode: DetailsListLayoutMode.fixedColumns,
      selection: this.selection,
      selectionMode: SelectionMode.none,
      compact: true,
      onRenderRow: this.onRenderRow,
      styles: {
        root: { width: "100%" },
      },
    };

    return (
      <FocusZone style={{ width: "100%" }}>
        <TextField {...searchFilterProps} />
        <SelectionZone {...selectionContainerProps}>
          <DetailsList {...detailsListProps} />
        </SelectionZone>
      </FocusZone>
    );
  }

  private renderBannerComponent(): JSX.Element {
    const bannerProps: React.ImgHTMLAttributes<HTMLImageElement> = {
      src: SaveQueryBannerIcon,
      alt: "Save query helper banner",
      style: {
        height: "150px",
        width: "310px",
        marginTop: "20px",
        border: `1px solid ${StyleConstants.BaseMedium}`,
      },
    };
    return (
      <div id="emptyQueryBanner">
        <div>
          You have not saved any queries yet. <br /> <br />
          To write a new query, open a new query tab and enter the desired query. Once ready to save, click on Save
          Query and follow the prompt in order to save the query.
        </div>
        <img {...bannerProps} />
      </div>
    );
  }

  private onFilterInputChange = (event: React.FormEvent<HTMLInputElement>, query: string): void => {
    if (query) {
      const filteredQueries: Query[] = this.state.queries.filter(
        (savedQuery: Query) =>
          savedQuery.queryName.indexOf(query) > -1 || savedQuery.queryName.toLowerCase().indexOf(query) > -1,
      );
      this.setState({
        filteredResults: filteredQueries,
      });
    } else {
      // no filter
      this.setState({
        filteredResults: this.state.queries,
      });
    }
  };

  private onRenderRow = (props: IDetailsRowProps): JSX.Element => {
    props.styles = {
      root: { width: "100%" },
      fields: {
        width: "100%",
        justifyContent: "space-between",
      },
      cell: {
        margin: "auto 0",
      },
    };
    return <DetailsRow data-selection-invoke={true} {...props} />;
  };

  private getColumns(): IColumn[] {
    return [
      {
        key: "Name",
        name: "Name",
        fieldName: "queryName",
        minWidth: 260,
      },
      {
        key: "Action",
        name: "Action",
        fieldName: undefined,
        minWidth: 70,
        onRender: (query: Query) => {
          const buttonProps: IButtonProps = {
            iconProps: {
              iconName: "More",
              title: "More",
              ariaLabel: "More actions button",
            },
            menuIconProps: {
              styles: { root: { display: "none" } },
            },
            menuProps: {
              isBeakVisible: true,
              items: [
                {
                  key: "Open",
                  text: "Open query",
                  onClick: () => {
                    this.props.onQuerySelect(query);
                  },
                },
                {
                  key: "Delete",
                  text: "Delete query",
                  onClick: async () => {
                    useDialog.getState().showOkCancelModalDialog(
                      "Confirm delete",
                      "Are you sure you want to delete this query?",
                      "Delete",
                      async () => {
                        const startKey: number = TelemetryProcessor.traceStart(Action.DeleteSavedQuery, {
                          dataExplorerArea: Constants.Areas.ContextualPane,
                          paneTitle: title,
                        });
                        try {
                          await this.props.queriesClient.deleteQuery(query);
                          TelemetryProcessor.traceSuccess(
                            Action.DeleteSavedQuery,
                            {
                              dataExplorerArea: Constants.Areas.ContextualPane,
                              paneTitle: title,
                            },
                            startKey,
                          );
                        } catch (error) {
                          TelemetryProcessor.traceFailure(
                            Action.DeleteSavedQuery,
                            {
                              dataExplorerArea: Constants.Areas.ContextualPane,
                              paneTitle: title,
                              error: getErrorMessage(error),
                              errorStack: getErrorStack(error),
                            },
                            startKey,
                          );
                        }
                        await this.fetchSavedQueries(); // get latest state
                      },
                      "Cancel",
                      undefined,
                    );
                  },
                },
              ],
            },
            menuAs: (menuProps: IContextualMenuProps): JSX.Element => {
              return <ContextualMenu {...menuProps} />;
            },
          };
          return <IconButton {...buttonProps} />;
        },
      },
    ];
  }

  private async fetchSavedQueries(): Promise<void> {
    let queries: Query[];
    try {
      queries = (await this.props.queriesClient.getQueries()) as Query[];
    } catch (error) {
      console.error(error);
      return;
    }
    queries = queries.map((query: Query) => {
      query.key = query.queryName;
      return query;
    });

    // we do a deep equality check before setting the state to avoid infinite re-renders
    if (!_.isEqual(queries, this.state.queries)) {
      this.setState({
        filteredResults: queries,
        queries: queries,
      });
    }
  }
}
