import * as React from "react";
import { Dispatch } from "redux";
import MonacoEditor from "@nteract/monaco-editor";
import { PrimaryButton } from "office-ui-fabric-react";
import { ChoiceGroup, IChoiceGroupOption } from "office-ui-fabric-react/lib/ChoiceGroup";
import Outputs from "@nteract/stateful-components/lib/outputs";
import { KernelOutputError, StreamText } from "@nteract/outputs";
import TransformMedia from "@nteract/stateful-components/lib/outputs/transform-media";
import { actions, selectors, AppState, ContentRef, KernelRef } from "@nteract/core";
import loadTransform from "../NotebookComponent/loadTransform";
import { connect } from "react-redux";
import Immutable from "immutable";

import "./MongoQueryComponent.less";
interface MongoQueryComponentPureProps {
  contentRef: ContentRef;
  kernelRef: KernelRef;
  databaseId: string;
  collectionId: string;
}

interface MongoQueryComponentDispatchProps {
  runCell: (contentRef: ContentRef, cellId: string) => void;
  addTransform: (transform: React.ComponentType & { MIMETYPE: string }) => void;
  onChange: (text: string, id: string, contentRef: ContentRef) => void;
  save: (contentRef: ContentRef) => void;
}

type OutputType = "rich" | "json";

interface MongoQueryComponentState {
  outputType: OutputType;
  selectedId: string;
}

const options: IChoiceGroupOption[] = [
  { key: "rich", text: "Rich Output" },
  { key: "json", text: "Json Output" }
];

interface MongoKernelJsonOutput {
  results: any;
}

interface MongoDocument {
  id: string;
}

type MongoQueryComponentProps = MongoQueryComponentPureProps & StateProps & MongoQueryComponentDispatchProps;
export class MongoQueryComponent extends React.Component<MongoQueryComponentProps, MongoQueryComponentState> {
  constructor(props: MongoQueryComponentProps) {
    super(props);
    this.state = {
      outputType: "json",
      selectedId: undefined
    };
  }

  componentDidMount(): void {
    loadTransform(this.props);
  }

  private onExecute = () => {
    this.props.runCell(this.props.contentRef, this.props.firstCellId);
    this.props.save(this.props.contentRef);
  };

  /**
   *
   * @param databaseId
   * @param collectionId
   * @param query e.g. { "lastName": { $in: ["Andersen"] } }
   */
  private createFilterQuery(databaseId: string, collectionId: string, query: string): string {
    const newCommand = `{ "command": "filter", "database": "${databaseId}", "collection": "${collectionId}", "filter": ${JSON.stringify(query)}, "outputType": "${this.state.outputType}" }`;
    return newCommand;
  }

  private onOutputTypeChange = (e: React.FormEvent<HTMLElement | HTMLInputElement>, option: IChoiceGroupOption): void => {
    const outputType = option.key as OutputType;
    this.setState({ outputType }, () => this.onInputChange(this.props.inputValue));
  };

  private onInputChange = (text: string) => {
    this.props.onChange(this.createFilterQuery(this.props.databaseId, this.props.collectionId, text),
      this.props.firstCellId, this.props.contentRef);
  };

  render(): JSX.Element {
    const { firstCellId: id, contentRef, outputDocuments } = this.props;

    if (!id) {
      return <></>;
    }

    return (
      <div className="mongoQueryComponent">
        <div className="queryInput">
          <MonacoEditor id={this.props.firstCellId} contentRef={this.props.contentRef} theme={""}
            language="json" onChange={this.onInputChange}
            value={this.props.inputValue} />
        </div>
        <PrimaryButton text="Apply" onClick={this.onExecute} disabled={!this.props.firstCellId} />
        <ChoiceGroup
          selectedKey={this.state.outputType}
          options={options}
          onChange={this.onOutputTypeChange}
          label="Output Type"
          styles={{ input: { marginTop: 0 }, root: { marginTop: 0 } }}
        />
        <hr />
        <div style={ { display: "flex" } }>
          <ul>
            {outputDocuments && outputDocuments.map(d => (
              <li key={d.id}>
                <a onClick={() => this.setState({ selectedId: id })}>{d.id}</a>
              </li>
              ))}
          </ul>
          <div style={{ width: "100%" }} >
          <MonacoEditor id={""} contentRef={""} theme={""} language="json" onChange={() => {}}
            value={JSON.stringify(outputDocuments.find(doc => doc.id ===this.state.selectedId)) ?? ""} />
          </div>
        </div>
        <hr />
        <Outputs id={id} contentRef={contentRef}>
          <TransformMedia output_type={"display_data"} id={id} contentRef={contentRef} />
          <TransformMedia output_type={"execute_result"} id={id} contentRef={contentRef} />
          <KernelOutputError />
          <StreamText />
        </Outputs>
      </div>
    );
  }
}

interface StateProps {
  firstCellId: string;
  inputValue: string;
  outputDocuments: MongoDocument[];
}
interface InitialProps {
  contentRef: string;
}

// Redux
const makeMapStateToProps = (state: AppState, initialProps: InitialProps) => {
  const { contentRef } = initialProps;
  const mapStateToProps = (state: AppState) => {
    let firstCellId;
    let inputValue = "";
    let outputDocuments = [];
    const content = selectors.content(state, { contentRef });
    if (content?.type === "notebook") {
      const cellOrder = selectors.notebook.cellOrder(content.model);
      if (cellOrder.size > 0) {
        firstCellId = cellOrder.first() as string;
        const cell = selectors.notebook.cellById(content.model, { id: firstCellId });

        // Parse to extract filter and output type
        const cellValue = cell.get("source", "");
        if (cellValue) {
          try {
            const filterValue = JSON.parse(cellValue).filter;
            if (filterValue) {
              inputValue = filterValue;
            }
          } catch(e) {
            console.error("Could not parse", e);
          }
        }
        const outputs = cell.get("outputs", Immutable.List());
        // Extract "application/json" mime-type
        let jsonOutput: MongoKernelJsonOutput;
        for (const output of outputs) {
          if (Object.prototype.hasOwnProperty.call(output.data, "application/json")) {
            jsonOutput = output.data["application/json"];
            break;
          }
        }
        outputDocuments = jsonOutput?.results ?? [];
      }
    }

    return {
      firstCellId,
      inputValue,
      outputDocuments
    };
  };
  return mapStateToProps;
};

const makeMapDispatchToProps = (initialDispatch: Dispatch, initialProps: MongoQueryComponentProps) => {
  const mapDispatchToProps = (dispatch: Dispatch) => {
    return {
      addTransform: (transform: React.ComponentType & { MIMETYPE: string }) => {
        return dispatch(
          actions.addTransform({
            mediaType: transform.MIMETYPE,
            component: transform
          })
        );
      },
      runCell: (contentRef: ContentRef, cellId: string) => {
        return dispatch(
          actions.executeCell({
            contentRef,
            id: cellId
          })
        );
      },
      onChange: (text: string, id: string, contentRef: ContentRef) => {
        dispatch(actions.updateCellSource({ id, contentRef, value: text }));
      },
      save: (contentRef: ContentRef) => {
        dispatch(actions.save({ contentRef }));
      }
    };
  };
  return mapDispatchToProps;
};

export default connect(makeMapStateToProps, makeMapDispatchToProps)(MongoQueryComponent);
