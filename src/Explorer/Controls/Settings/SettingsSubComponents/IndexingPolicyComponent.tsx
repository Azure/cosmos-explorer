import { IMessageBarStyles, MessageBar, MessageBarType, Stack } from "@fluentui/react";
import { monacoTheme, useThemeStore } from "hooks/useTheme";
import * as monaco from "monaco-editor";
import * as React from "react";
import * as DataModels from "../../../../Contracts/DataModels";
import { loadMonaco } from "../../../LazyMonaco";
import { titleAndInputStackProps, unsavedEditorWarningMessage } from "../SettingsRenderUtils";
import { isDirty, isIndexTransforming } from "../SettingsUtils";
import { IndexingPolicyRefreshComponent } from "./IndexingPolicyRefresh/IndexingPolicyRefreshComponent";
export interface IndexingPolicyComponentProps {
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
  private themeUnsubscribe: () => void;

  private darkThemeMessageBarStyles: Partial<IMessageBarStyles> = {
    root: {
      selectors: {
        "&.ms-MessageBar--warning": {
          backgroundColor: "var(--colorStatusWarningBackground1)",
          border: "1px solid var(--colorStatusWarningBorder1)",
        },
        ".ms-MessageBar-icon": {
          color: "var(--colorNeutralForeground1)",
        },
        ".ms-MessageBar-text": {
          color: "var(--colorNeutralForeground1)",
        },
      },
    },
  };

  constructor(props: IndexingPolicyComponentProps) {
    super(props);
    this.state = {
      indexingPolicyContentIsValid: true,
    };
  }

  componentDidUpdate(): void {
    if (this.props.shouldDiscardIndexingPolicy) {
      this.resetIndexingPolicyEditor();
      this.props.resetShouldDiscardIndexingPolicy();
    }
    this.onComponentUpdate();
  }

  componentDidMount(): void {
    this.resetIndexingPolicyEditor();
    this.onComponentUpdate();
  }

  componentWillUnmount(): void {
    this.themeUnsubscribe && this.themeUnsubscribe();
  }

  public resetIndexingPolicyEditor = (): void => {
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
    if (!this.indexingPolicyDiv.current) {
      return;
    }
    const value: string = JSON.stringify(this.props.indexingPolicyContent, undefined, 4);
    const monaco = await loadMonaco();
    if (this.indexingPolicyDiv.current) {
      this.indexingPolicyEditor = monaco.editor.create(this.indexingPolicyDiv.current, {
        value: value,
        language: "json",
        readOnly: isIndexTransforming(this.props.indexTransformationProgress),
        ariaLabel: "Indexing Policy",
        theme: monacoTheme(),
      });
      if (this.indexingPolicyEditor) {
        this.themeUnsubscribe = useThemeStore.subscribe(() => {
          if (this.indexingPolicyEditor) {
            monaco.editor.setTheme(monacoTheme());
          }
        });

        const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
        indexingPolicyEditorModel.onDidChangeContent(this.onEditorContentChange.bind(this));
        this.props.logIndexingPolicySuccessMessage();
      }
    }
  }

  private onEditorContentChange = (): void => {
    const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
    try {
      const newIndexingPolicyContent = JSON.parse(indexingPolicyEditorModel.getValue()) as DataModels.IndexingPolicy;
      this.props.onIndexingPolicyContentChange(newIndexingPolicyContent);
      this.setState({ indexingPolicyContentIsValid: true });
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
          <MessageBar
            messageBarType={MessageBarType.warning}
            messageBarIconProps={{ iconName: "WarningSolid", className: "messageBarWarningIcon" }}
            styles={this.darkThemeMessageBarStyles}
          >
            {unsavedEditorWarningMessage("indexPolicy")}
          </MessageBar>
        )}
        <div className="settingsV2Editor" tabIndex={0} ref={this.indexingPolicyDiv}></div>
      </Stack>
    );
  }
}
