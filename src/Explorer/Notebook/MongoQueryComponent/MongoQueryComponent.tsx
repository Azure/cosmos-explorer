import * as React from "react";
import { Dispatch } from "redux";
import MonacoEditor from "@nteract/stateful-components/lib/inputs/connected-editors/monacoEditor";
import { PrimaryButton } from "office-ui-fabric-react";
import { ChoiceGroup, IChoiceGroupOption } from "office-ui-fabric-react/lib/ChoiceGroup";
import Input from "@nteract/stateful-components/lib/inputs/input";
import Editor from "@nteract/stateful-components/lib/inputs/editor";
import { Source } from "@nteract/presentational-components";
import Outputs from "@nteract/stateful-components/lib/outputs";
import { KernelOutputError, StreamText } from "@nteract/outputs";
import TransformMedia from "@nteract/stateful-components/lib/outputs/transform-media";
import { PassedEditorProps } from "@nteract/stateful-components/lib/inputs/editor";
import { actions, selectors, AppState, ContentRef, KernelRef } from "@nteract/core";
import loadTransform from "../NotebookComponent/loadTransform";
import { connect } from "react-redux";

interface MongoQueryComponentPureProps {
  contentRef: ContentRef;
  kernelRef: KernelRef;
}

interface MongoQueryComponentDispatchProps {
  runCell: (contentRef: ContentRef, cellId: string) => void;
  addTransform: (transform: React.ComponentType & { MIMETYPE: string }) => void;
}

type OutputType = "rich" | "json";

interface MongoQueryComponentState {
  outputType: OutputType;
}

const options: IChoiceGroupOption[] = [
  { key: "rich", text: "Rich Output" },
  { key: "json", text: "Json Output" }
];

type MongoQueryComponentProps = MongoQueryComponentPureProps & StateProps & MongoQueryComponentDispatchProps;
export class MongoQueryComponent extends React.Component<MongoQueryComponentProps, MongoQueryComponentState> {
  constructor(props: MongoQueryComponentProps) {
    super(props);
    this.state = {
      outputType: "rich"
    };
  }

  componentDidMount(): void {
    loadTransform(this.props);
  }

  private onExecute = () => {
    this.props.runCell(this.props.contentRef, this.props.firstCellId);
  };

  private onOutputTypeChange = (e: React.FormEvent<HTMLElement | HTMLInputElement>): void => {
    const outputType = e.target.value as OutputType;
    this.setState({ outputType });
  };

  render(): JSX.Element {
    const editor = {
      monaco: (props: PassedEditorProps) => <MonacoEditor {...props} editorType={"monaco"} />
    };

    const { firstCellId: id, contentRef } = this.props;

    if (!id) {
      return <></>;
    }

    return (
      <div style={{ marginLeft: 10 }}>
        <div>
          <Input id={id} contentRef={contentRef}>
            <Source className="nteract-cell-source">
              <Editor id={id} contentRef={contentRef}>
                {editor}
              </Editor>
            </Source>
          </Input>
          <PrimaryButton text="Primary" onClick={this.onExecute} disabled={!this.props.firstCellId} />
          <ChoiceGroup
            selectedKey={this.state.outputType}
            options={options}
            onChange={this.onOutputTypeChange}
            label="Output Type"
          />
          <hr />
          <Outputs id={id} contentRef={contentRef}>
            <TransformMedia output_type={"display_data"} id={id} contentRef={contentRef} />
            <TransformMedia output_type={"execute_result"} id={id} contentRef={contentRef} />
            <KernelOutputError />
            <StreamText />
          </Outputs>
        </div>
      </div>
    );
  }
}

interface StateProps {
  firstCellId: string;
}
interface InitialProps {
  contentRef: string;
}

// Redux
const makeMapStateToProps = (state: AppState, initialProps: InitialProps) => {
  const { contentRef } = initialProps;
  console.log("makeMapStateToProps");

  const mapStateToProps = (state: AppState) => {
    let firstCellId;

    const content = selectors.content(state, { contentRef });

    console.log("Looking for first cell", content?.type, state);
    if (content?.type === "notebook") {
      const cellOrder = selectors.notebook.cellOrder(content.model);
      if (cellOrder.size > 0) {
        firstCellId = cellOrder.first() as string;
      }
    }

    return {
      firstCellId
    };
  };
  return mapStateToProps;
};

const makeMapDispatchToProps = (/* initialDispatch: Dispatch, initialProps: MongoQueryComponentProps */) => {
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
      }
    };
  };
  return mapDispatchToProps;
};

export default connect(makeMapStateToProps, makeMapDispatchToProps)(MongoQueryComponent);
