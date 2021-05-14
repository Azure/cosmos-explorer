import { Spinner, SpinnerSize, Stack } from "@fluentui/react";
import { ImmutableExecuteResult, ImmutableOutput } from "@nteract/commutable";
import { actions, AppState, ContentRef, KernelRef, selectors } from "@nteract/core";
import Immutable from "immutable";
import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceStart, traceSuccess } from "../../../Shared/Telemetry/TelemetryProcessor";
import loadTransform from "../NotebookComponent/loadTransform";
import SandboxOutputs from "../NotebookRenderer/outputs/SandboxOutputs";
import "./SchemaAnalyzer.less";
import { DefaultFilter, DefaultSampleSize, SchemaAnalyzerHeader } from "./SchemaAnalyzerHeader";
import { SchemaAnalyzerSplashScreen } from "./SchemaAnalyzerSplashScreen";

interface SchemaAnalyzerPureProps {
  contentRef: ContentRef;
  kernelRef: KernelRef;
  databaseId: string;
  collectionId: string;
}

interface SchemaAnalyzerDispatchProps {
  runCell: (contentRef: ContentRef, cellId: string) => void;
  addTransform: (transform: React.ComponentType & { MIMETYPE: string }) => void;
  updateCell: (text: string, id: string, contentRef: ContentRef) => void;
}

type OutputType = "rich" | "json";

interface SchemaAnalyzerState {
  outputType: OutputType;
  isFiltering: boolean;
  sampleSize: string;
}

type SchemaAnalyzerProps = SchemaAnalyzerPureProps & StateProps & SchemaAnalyzerDispatchProps;

export class SchemaAnalyzer extends React.Component<SchemaAnalyzerProps, SchemaAnalyzerState> {
  private clickAnalyzeTelemetryStartKey: number;

  constructor(props: SchemaAnalyzerProps) {
    super(props);
    this.state = {
      outputType: "rich",
      isFiltering: false,
      sampleSize: DefaultSampleSize,
    };
  }

  componentDidMount(): void {
    loadTransform(this.props);
  }

  private onAnalyzeButtonClick = (filter: string = DefaultFilter, sampleSize: string = this.state.sampleSize) => {
    const query = {
      command: "listSchema",
      database: this.props.databaseId,
      collection: this.props.collectionId,
      outputType: this.state.outputType,
      filter,
      sampleSize,
    };

    this.setState({
      isFiltering: true,
    });

    this.props.updateCell(JSON.stringify(query), this.props.firstCellId, this.props.contentRef);

    this.clickAnalyzeTelemetryStartKey = traceStart(Action.SchemaAnalyzerClickAnalyze, {
      database: this.props.databaseId,
      collection: this.props.collectionId,
      sampleSize,
    });

    this.props.runCell(this.props.contentRef, this.props.firstCellId);
  };

  private traceClickAnalyzeComplete = (kernelStatus: string, outputs: Immutable.List<ImmutableOutput>) => {
    /**
     * CosmosMongoKernel always returns 1st output as "text/html"
     * This output can be an error stack or information about how many documents were sampled
     */
    let firstTextHtmlOutput: string;
    if (outputs.size > 0 && outputs.get(0).output_type === "execute_result") {
      const executeResult = outputs.get(0) as ImmutableExecuteResult;
      firstTextHtmlOutput = executeResult.data["text/html"];
    }

    const data = {
      database: this.props.databaseId,
      collection: this.props.collectionId,
      firstTextHtmlOutput,
      sampleSize: this.state.sampleSize,
      numOfOutputs: outputs.size,
      kernelStatus,
    };

    // Only in cases where CosmosMongoKernel runs into an error we get a single output
    if (outputs.size === 1) {
      traceFailure(Action.SchemaAnalyzerClickAnalyze, data, this.clickAnalyzeTelemetryStartKey);
    } else {
      traceSuccess(Action.SchemaAnalyzerClickAnalyze, data, this.clickAnalyzeTelemetryStartKey);
    }
  };

  render(): JSX.Element {
    const { firstCellId: id, contentRef, kernelStatus, outputs } = this.props;
    if (!id) {
      return <></>;
    }

    const isKernelBusy = kernelStatus === "busy";
    const isKernelIdle = kernelStatus === "idle";
    const showSchemaOutput = isKernelIdle && outputs?.size > 0;

    if (showSchemaOutput && this.clickAnalyzeTelemetryStartKey) {
      this.traceClickAnalyzeComplete(kernelStatus, outputs);
      this.clickAnalyzeTelemetryStartKey = undefined;
    }

    return (
      <div className="schemaAnalyzer">
        <Stack tokens={{ childrenGap: 20, padding: 20 }}>
          <SchemaAnalyzerHeader
            isKernelIdle={isKernelIdle}
            isKernelBusy={isKernelBusy}
            onSampleSizeUpdated={(sampleSize) => this.setState({ sampleSize })}
            onAnalyzeButtonClick={this.onAnalyzeButtonClick}
          />

          {showSchemaOutput ? (
            <SandboxOutputs
              id={id}
              contentRef={contentRef}
              outputsContainerClassName="schema-analyzer-cell-outputs"
              outputClassName="schema-analyzer-cell-output"
            />
          ) : this.state.isFiltering ? (
            <Spinner styles={{ root: { marginTop: 40 } }} size={SpinnerSize.large} />
          ) : (
            <SchemaAnalyzerSplashScreen
              isKernelIdle={isKernelIdle}
              isKernelBusy={isKernelBusy}
              onAnalyzeButtonClick={this.onAnalyzeButtonClick}
            />
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

export default connect(makeMapStateToProps, makeMapDispatchToProps)(SchemaAnalyzer);
