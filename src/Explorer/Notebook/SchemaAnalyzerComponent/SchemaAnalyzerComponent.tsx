import { ImmutableOutput } from "@nteract/commutable";
import { actions, AppState, ContentRef, KernelRef, selectors } from "@nteract/core";
import Immutable from "immutable";
import { FontIcon, PrimaryButton, Spinner, SpinnerSize, Stack, Text, TextField } from "office-ui-fabric-react";
import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import loadTransform from "../NotebookComponent/loadTransform";
import SandboxOutputs from "../NotebookRenderer/outputs/SandboxOutputs";
import "./SchemaAnalyzerComponent.less";

interface SchemaAnalyzerComponentPureProps {
  contentRef: ContentRef;
  kernelRef: KernelRef;
  databaseId: string;
  collectionId: string;
}

interface SchemaAnalyzerComponentDispatchProps {
  runCell: (contentRef: ContentRef, cellId: string) => void;
  addTransform: (transform: React.ComponentType & { MIMETYPE: string }) => void;
  updateCell: (text: string, id: string, contentRef: ContentRef) => void;
}

type OutputType = "rich" | "json";

interface SchemaAnalyzerComponentState {
  outputType: OutputType;
  filter?: string;
  isFiltering: boolean;
}

type SchemaAnalyzerComponentProps = SchemaAnalyzerComponentPureProps &
  StateProps &
  SchemaAnalyzerComponentDispatchProps;

export class SchemaAnalyzerComponent extends React.Component<
  SchemaAnalyzerComponentProps,
  SchemaAnalyzerComponentState
> {
  constructor(props: SchemaAnalyzerComponentProps) {
    super(props);
    this.state = {
      outputType: "rich",
      isFiltering: false,
    };
  }

  componentDidMount(): void {
    loadTransform(this.props);
  }

  private onFilterTextFieldChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    this.setState({
      filter: newValue,
    });
  };

  private onAnalyzeButtonClick = () => {
    const query = {
      command: "listSchema",
      database: this.props.databaseId,
      collection: this.props.collectionId,
      outputType: this.state.outputType,
      filter: this.state.filter,
    };

    if (this.state.filter) {
      this.setState({
        isFiltering: true,
      });
    }

    this.props.updateCell(JSON.stringify(query), this.props.firstCellId, this.props.contentRef);
    this.props.runCell(this.props.contentRef, this.props.firstCellId);
  };

  render(): JSX.Element {
    const { firstCellId: id, contentRef, kernelStatus, outputs } = this.props;
    if (!id) {
      return <></>;
    }

    const isKernelBusy = kernelStatus === "busy";
    const isKernelIdle = kernelStatus === "idle";
    const showSchemaOutput = isKernelIdle && outputs.size > 0;

    return (
      <div className="schemaAnalyzerComponent">
        <Stack horizontalAlign="center" tokens={{ childrenGap: 20, padding: 20 }}>
          <Stack.Item grow styles={{ root: { display: "contents" } }}>
            <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { width: "100%" } }}>
              <Stack.Item grow align="end">
                <TextField
                  value={this.state.filter}
                  onChange={this.onFilterTextFieldChange}
                  label="Filter"
                  placeholder="{ field: 'value' }"
                  disabled={!isKernelIdle}
                />
              </Stack.Item>
              <Stack.Item align="end">
                <PrimaryButton
                  text={isKernelBusy ? "Analyzing..." : "Analyze"}
                  onClick={this.onAnalyzeButtonClick}
                  disabled={!isKernelIdle}
                />
              </Stack.Item>
            </Stack>
          </Stack.Item>

          {showSchemaOutput ? (
            <SandboxOutputs
              id={id}
              contentRef={contentRef}
              outputsContainerClassName="schema-analyzer-cell-outputs"
              outputClassName="schema-analyzer-cell-output"
            />
          ) : this.state.isFiltering ? (
            <Stack.Item>
              {isKernelBusy && <Spinner styles={{ root: { marginTop: 40 } }} size={SpinnerSize.large} />}
            </Stack.Item>
          ) : (
            <>
              <Stack.Item>
                <FontIcon iconName="Chart" style={{ fontSize: 100, color: "#43B1E5", marginTop: 40 }} />
              </Stack.Item>
              <Stack.Item>
                <Text variant="xxLarge">Explore your schema</Text>
              </Stack.Item>
              <Stack.Item>
                <Text variant="large">
                  Quickly visualize your schema to infer the frequency, types and ranges of fields in your data set.
                </Text>
              </Stack.Item>
              <Stack.Item>
                <PrimaryButton
                  styles={{ root: { fontSize: 18, padding: 30 } }}
                  text={isKernelBusy ? "Analyzing..." : "Analyze Schema"}
                  onClick={this.onAnalyzeButtonClick}
                  disabled={kernelStatus !== "idle"}
                />
              </Stack.Item>
              <Stack.Item>{isKernelBusy && <Spinner size={SpinnerSize.large} />}</Stack.Item>
            </>
          )}
        </Stack>
      </div>
    );
  }
}

interface StateProps {
  firstCellId: string;
  kernelStatus: string;
  outputs: Immutable.List<ImmutableOutput>;
}

interface InitialProps {
  kernelRef: string;
  contentRef: string;
}

// Redux
const makeMapStateToProps = (state: AppState, initialProps: InitialProps) => {
  const { kernelRef, contentRef } = initialProps;
  const mapStateToProps = (state: AppState) => {
    let kernelStatus;
    let firstCellId;
    let outputs;

    const kernel = selectors.kernel(state, { kernelRef });
    if (kernel) {
      kernelStatus = kernel.status;
    }

    const content = selectors.content(state, { contentRef });
    if (content?.type === "notebook") {
      const cellOrder = selectors.notebook.cellOrder(content.model);
      if (cellOrder.size > 0) {
        firstCellId = cellOrder.first() as string;

        const model = selectors.model(state, { contentRef });
        if (model && model.type === "notebook") {
          const cell = selectors.notebook.cellById(model, { id: firstCellId });
          if (cell) {
            outputs = cell.get("outputs", Immutable.List());
          }
        }
      }
    }

    return {
      firstCellId,
      kernelStatus,
      outputs,
    };
  };
  return mapStateToProps;
};

const makeMapDispatchToProps = () => {
  const mapDispatchToProps = (dispatch: Dispatch) => {
    return {
      addTransform: (transform: React.ComponentType & { MIMETYPE: string }) => {
        return dispatch(
          actions.addTransform({
            mediaType: transform.MIMETYPE,
            component: transform,
          })
        );
      },
      runCell: (contentRef: ContentRef, cellId: string) => {
        return dispatch(
          actions.executeCell({
            contentRef,
            id: cellId,
          })
        );
      },
      updateCell: (text: string, id: string, contentRef: ContentRef) => {
        dispatch(actions.updateCellSource({ id, contentRef, value: text }));
      },
    };
  };
  return mapDispatchToProps;
};

export default connect(makeMapStateToProps, makeMapDispatchToProps)(SchemaAnalyzerComponent);
