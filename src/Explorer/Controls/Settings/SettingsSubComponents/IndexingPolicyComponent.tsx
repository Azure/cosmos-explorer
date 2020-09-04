import * as React from "react";
import { StatefulValue } from "../../StatefulValue";
import * as DataModels from "../../../../Contracts/DataModels";
import * as monaco from "monaco-editor";

export interface IndexingPolicyComponentProps {
  shouldDiscardIndexingPolicy: boolean,
  resetShouldDiscardIndexingPolicy: () => void,
  indexingPolicyContent: StatefulValue<DataModels.IndexingPolicy>;
  setIndexingPolicyElementFocussed: (indexingPolicyContentFocussed: boolean) => void;
  setIndexingPolicyContent: (newIndexingPolicy: DataModels.IndexingPolicy) => void;
  setIndexingPolicyValidity: (isValid: boolean) => void;
  logIndexingPolicySuccessMessage: () => void;
}

export class IndexingPolicyComponent extends React.Component<
  IndexingPolicyComponentProps> {
  private indexingPolicyDiv = React.createRef<HTMLDivElement>();
  private indexingPolicyEditor: monaco.editor.IStandaloneCodeEditor;

  constructor(props: IndexingPolicyComponentProps) {
    super(props);
  }

  componentDidUpdate() {
    if(this.props.shouldDiscardIndexingPolicy) {
        this.resetIndexingPolicyEditor();
        this.props.resetShouldDiscardIndexingPolicy()
    }
  }

  componentDidMount() {
    this.resetIndexingPolicyEditor();
  }

  private resetIndexingPolicyEditor = () => {
    if (!this.indexingPolicyEditor) {
      this.createIndexingPolicyEditor();
    } else {
      const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
      const value: string = JSON.stringify(this.props.indexingPolicyContent.current, undefined, 4);
      indexingPolicyEditorModel.setValue(value);
    }
  };

  private createIndexingPolicyEditor = (): void => {
    const value: string = JSON.stringify(this.props.indexingPolicyContent.current, undefined, 4);

    this.indexingPolicyEditor = monaco.editor.create(this.indexingPolicyDiv.current, {
      value: value,
      language: "json",
      readOnly: false,
      ariaLabel: "Indexing Policy"
    });
    if (this.indexingPolicyEditor) {
      this.indexingPolicyEditor.onDidFocusEditorText(() => this.props.setIndexingPolicyElementFocussed(true));
      this.indexingPolicyEditor.onDidBlurEditorText(() => this.props.setIndexingPolicyElementFocussed(false));
      const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
      indexingPolicyEditorModel.onDidChangeContent(this.onEditorContentChange.bind(this));
      this.props.logIndexingPolicySuccessMessage();
    }
  };

  private onEditorContentChange = (): void => {
    const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
    try {
      const newIndexingPolicyContent = JSON.parse(indexingPolicyEditorModel.getValue()) as DataModels.IndexingPolicy;
      this.props.setIndexingPolicyContent(newIndexingPolicyContent);
      this.props.setIndexingPolicyValidity(true);
    } catch (e) {
      this.props.setIndexingPolicyValidity(true);
    }
  };

  public render(): JSX.Element {
    return (
      <>
        <div
          key="indexingPolicyEditorDiv"
          className="indexingPolicyEditor"
          tabIndex={0}
          ref={this.indexingPolicyDiv}
        ></div>
      </>
    );
  }
}
