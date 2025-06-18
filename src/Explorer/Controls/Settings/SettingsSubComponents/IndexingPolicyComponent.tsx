import { MessageBar, MessageBarType, Stack } from "@fluentui/react";
import { useIndexingPolicyStore } from "Explorer/Tabs/QueryTab/ResultsView";
import * as monaco from "monaco-editor";
import * as React from "react";
import * as DataModels from "../../../../Contracts/DataModels";
import { loadMonaco } from "../../../LazyMonaco";
import { titleAndInputStackProps, unsavedEditorWarningMessage } from "../SettingsRenderUtils";
import { isDirty, isIndexTransforming } from "../SettingsUtils";
import { IndexingPolicyRefreshComponent } from "./IndexingPolicyRefresh/IndexingPolicyRefreshComponent";

export interface IndexingPolicyComponentProps {
  // containerId: string;
  shouldDiscardIndexingPolicy: boolean;
  resetShouldDiscardIndexingPolicy: () => void;
  indexingPolicyContent: DataModels.IndexingPolicy;
  indexingPolicyContentBaseline: DataModels.IndexingPolicy;
  onIndexingPolicyContentChange: (newIndexingPolicy: DataModels.IndexingPolicy) => void;
  logIndexingPolicySuccessMessage: () => void;
  indexTransformationProgress: number;
  refreshIndexTransformationProgress: () => Promise<void>;
  isVectorSearchEnabled?: boolean;
  onIndexingPolicyDirtyChange: (isIndexingPolicyDirty: boolean) => void;
}

interface IndexingPolicyComponentState {
  indexingPolicyContentIsValid: boolean;
}

export class IndexingPolicyComponent extends React.Component<
  IndexingPolicyComponentProps,
  IndexingPolicyComponentState
> {
  private shouldCheckComponentIsDirty = true;
  private indexingPolicyDiv = React.createRef<HTMLDivElement>();
  private indexingPolicyEditor: monaco.editor.IStandaloneCodeEditor;
  private unsubscribeFromStore: () => void;
  constructor(props: IndexingPolicyComponentProps) {
    super(props);
    this.state = {
      indexingPolicyContentIsValid: true,
    };
  }

  componentDidUpdate(): void {
    // const { indexingPolicy } = useIndexingPolicyStore.getState();
    if (this.props.shouldDiscardIndexingPolicy) {
      this.resetIndexingPolicyEditor();
      this.props.resetShouldDiscardIndexingPolicy();
    }
    this.onComponentUpdate();
  }

  componentDidMount(): void {
    // const { indexingPolicy, baselinePolicy } = useIndexingPolicyStore.getState();
    this.resetIndexingPolicyEditor();
    this.onComponentUpdate();
  }

  public resetIndexingPolicyEditor = (): void => {
    // const { indexingPolicy, baselinePolicy } = useIndexingPolicyStore.getState();
    if (!this.indexingPolicyEditor) {
      this.createIndexingPolicyEditor();
    } else {
      this.indexingPolicyEditor.updateOptions({
        readOnly: isIndexTransforming(this.props.indexTransformationProgress),
      });
      const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
      const value: string = JSON.stringify(this.props.indexingPolicyContent, undefined, 4);
      indexingPolicyEditorModel.setValue(value);
    }
    this.onComponentUpdate();
  };

  private onComponentUpdate = (): void => {
    if (!this.shouldCheckComponentIsDirty) {
      this.shouldCheckComponentIsDirty = true;
      return;
    }
    // const isDirtyState = isDirty(storeIndexingPolicy, this.props.indexingPolicyContentBaseline);
    // this.props.onIndexingPolicyDirtyChange(isDirtyState && this.state.indexingPolicyContentIsValid);
    // this.shouldCheckComponentIsDirty = false;
    this.props.onIndexingPolicyDirtyChange(this.IsComponentDirty());
    this.shouldCheckComponentIsDirty = false;
  };

  public IsComponentDirty = (): boolean => {
    if (
      isDirty(this.props.indexingPolicyContent, this.props.indexingPolicyContentBaseline) &&
      this.state.indexingPolicyContentIsValid
    ) {
      return true;
    }

    return false;
  };

  private async createIndexingPolicyEditor(): Promise<void> {
    const { indexingPolicy, baselinePolicy } = useIndexingPolicyStore.getState();
    const policyToUse = this.props.indexingPolicyContent;

    // const value: string = JSON.stringify(policyToUse, undefined, 4);
    const value: string = JSON.stringify(this.props.indexingPolicyContent, undefined, 4);
    const monaco = await loadMonaco();
    this.indexingPolicyEditor = monaco.editor.create(this.indexingPolicyDiv.current, {
      value: value,
      language: "json",
      readOnly: isIndexTransforming(this.props.indexTransformationProgress),
      ariaLabel: "Indexing Policy",
    });
    if (this.indexingPolicyEditor) {
      const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
      indexingPolicyEditorModel.onDidChangeContent(this.onEditorContentChange.bind(this));
      this.props.logIndexingPolicySuccessMessage();
    }
    console.log("compp", indexingPolicy);
    console.log("Accessed policy from Zustand store:", useIndexingPolicyStore.getState().indexingPolicy);
    console.log("actual indexing content", this.props.indexingPolicyContent);
    console.log("baseline", this.props.indexingPolicyContentBaseline);
  }

  private onEditorContentChange = (): void => {
    const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
    try {
      const newIndexingPolicyContent = JSON.parse(indexingPolicyEditorModel.getValue()) as DataModels.IndexingPolicy;
      // useIndexingPolicyStore.getState().setIndexingPolicyOnly(newIndexingPolicyContent);
      this.props.onIndexingPolicyContentChange(newIndexingPolicyContent);
      this.setState({ indexingPolicyContentIsValid: true });
      // console.log("editor", newIndexingPolicyContent);
    } catch (e) {
      this.setState({ indexingPolicyContentIsValid: false });
    }
  };

  public render(): JSX.Element {
    return (
      <Stack {...titleAndInputStackProps}>
        <IndexingPolicyRefreshComponent
          indexTransformationProgress={this.props.indexTransformationProgress}
          refreshIndexTransformationProgress={this.props.refreshIndexTransformationProgress}
        />
        {isDirty(this.props.indexingPolicyContent, this.props.indexingPolicyContentBaseline) && (
          <MessageBar messageBarType={MessageBarType.warning}>{unsavedEditorWarningMessage("indexPolicy")}</MessageBar>
        )}
        <div className="settingsV2Editor" tabIndex={0} ref={this.indexingPolicyDiv}></div>
      </Stack>
    );
  }
}
