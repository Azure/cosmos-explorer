import * as React from "react";
import * as DataModels from "../../../../Contracts/DataModels";
import * as monaco from "monaco-editor";

export interface IndexingPolicyComponentProps {
  shouldDiscardIndexingPolicy: boolean;
  resetShouldDiscardIndexingPolicy: () => void;
  indexingPolicyContent: DataModels.IndexingPolicy;
  onIndexingPolicyElementFocusChange: (indexingPolicyContentFocussed: boolean) => void;
  onIndexingPolicyContentChange: (newIndexingPolicy: DataModels.IndexingPolicy) => void;
  onIndexingPolicyValidityChange: (isValid: boolean) => void;
  logIndexingPolicySuccessMessage: () => void;
}

export class IndexingPolicyComponent extends React.Component<IndexingPolicyComponentProps> {
  private indexingPolicyDiv = React.createRef<HTMLDivElement>();
  private indexingPolicyEditor: monaco.editor.IStandaloneCodeEditor;

  componentDidUpdate(): void {
    if (this.props.shouldDiscardIndexingPolicy) {
      this.resetIndexingPolicyEditor();
      this.props.resetShouldDiscardIndexingPolicy();
    }
  }

  componentDidMount(): void {
    this.resetIndexingPolicyEditor();
  }

  public resetIndexingPolicyEditor = (): void => {
    if (!this.indexingPolicyEditor) {
      this.createIndexingPolicyEditor();
    } else {
      const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
      const value: string = JSON.stringify(this.props.indexingPolicyContent, undefined, 4);
      indexingPolicyEditorModel.setValue(value);
    }
  };

  private createIndexingPolicyEditor = (): void => {
    const value: string = JSON.stringify(this.props.indexingPolicyContent, undefined, 4);

    this.indexingPolicyEditor = monaco.editor.create(this.indexingPolicyDiv.current, {
      value: value,
      language: "json",
      readOnly: false,
      ariaLabel: "Indexing Policy"
    });
    if (this.indexingPolicyEditor) {
      this.indexingPolicyEditor.onDidFocusEditorText(() => this.props.onIndexingPolicyElementFocusChange(true));
      this.indexingPolicyEditor.onDidBlurEditorText(() => this.props.onIndexingPolicyElementFocusChange(false));
      const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
      indexingPolicyEditorModel.onDidChangeContent(this.onEditorContentChange.bind(this));
      this.props.logIndexingPolicySuccessMessage();
    }
  };

  private onEditorContentChange = (): void => {
    const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
    try {
      const newIndexingPolicyContent = JSON.parse(indexingPolicyEditorModel.getValue()) as DataModels.IndexingPolicy;
      this.props.onIndexingPolicyContentChange(newIndexingPolicyContent);
      this.props.onIndexingPolicyValidityChange(true);
    } catch (e) {
      this.props.onIndexingPolicyValidityChange(false);
    }
  };

  public render(): JSX.Element {
    return <div className="indexingPolicyEditor" tabIndex={0} ref={this.indexingPolicyDiv}></div>;
  }
}
