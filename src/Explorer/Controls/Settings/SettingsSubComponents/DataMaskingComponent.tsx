import { MessageBar, MessageBarType, Stack } from "@fluentui/react";
import * as monaco from "monaco-editor";
import * as React from "react";
import * as Constants from "../../../../Common/Constants";
import * as DataModels from "../../../../Contracts/DataModels";
import { isCapabilityEnabled } from "../../../../Utils/CapabilityUtils";
import { loadMonaco } from "../../../LazyMonaco";
import { titleAndInputStackProps, unsavedEditorWarningMessage } from "../SettingsRenderUtils";
import { isDirty as isContentDirty } from "../SettingsUtils";

export interface DataMaskingComponentProps {
  shouldDiscardDataMasking: boolean;
  resetShouldDiscardDataMasking: () => void;
  dataMaskingContent: DataModels.DataMaskingPolicy;
  dataMaskingContentBaseline: DataModels.DataMaskingPolicy;
  onDataMaskingContentChange: (dataMasking: DataModels.DataMaskingPolicy) => void;
  onDataMaskingDirtyChange: (isDirty: boolean) => void;
  validationErrors: string[];
}

interface DataMaskingComponentState {
  isDirty: boolean;
  dataMaskingContentIsValid: boolean;
}

const emptyDataMaskingPolicy: DataModels.DataMaskingPolicy = {
  includedPaths: [
    {
      path: "/",
      strategy: "Default",
      startPosition: 0,
      length: -1,
    },
  ],
  excludedPaths: [],
  policyFormatVersion: 2,
  isPolicyEnabled: false,
};

export class DataMaskingComponent extends React.Component<DataMaskingComponentProps, DataMaskingComponentState> {
  private dataMaskingDiv = React.createRef<HTMLDivElement>();
  private dataMaskingEditor: monaco.editor.IStandaloneCodeEditor;
  private shouldCheckComponentIsDirty = true;

  constructor(props: DataMaskingComponentProps) {
    super(props);
    this.state = {
      isDirty: false,
      dataMaskingContentIsValid: true,
    };
  }

  public componentDidUpdate(): void {
    if (this.props.shouldDiscardDataMasking) {
      this.resetDataMaskingEditor();
      this.props.resetShouldDiscardDataMasking();
    }
    this.onComponentUpdate();
  }

  componentDidMount(): void {
    this.resetDataMaskingEditor();
    this.onComponentUpdate();
  }

  private onComponentUpdate = (): void => {
    if (!this.shouldCheckComponentIsDirty) {
      this.shouldCheckComponentIsDirty = true;
      return;
    }
    this.props.onDataMaskingDirtyChange(this.IsComponentDirty());
    this.shouldCheckComponentIsDirty = false;
  };

  public IsComponentDirty = (): boolean => {
    if (
      isContentDirty(this.props.dataMaskingContent, this.props.dataMaskingContentBaseline) &&
      this.state.dataMaskingContentIsValid
    ) {
      return true;
    }
    return false;
  };

  private resetDataMaskingEditor = (): void => {
    if (!this.dataMaskingEditor) {
      this.createDataMaskingEditor();
    } else {
      const dataMaskingEditorModel = this.dataMaskingEditor.getModel();
      const value: string = JSON.stringify(this.props.dataMaskingContent || emptyDataMaskingPolicy, undefined, 4);
      dataMaskingEditorModel.setValue(value);
    }
    this.onComponentUpdate();
  };

  private async createDataMaskingEditor(): Promise<void> {
    const value: string = JSON.stringify(this.props.dataMaskingContent || emptyDataMaskingPolicy, undefined, 4);
    const monaco = await loadMonaco();
    this.dataMaskingEditor = monaco.editor.create(this.dataMaskingDiv.current, {
      value: value,
      language: "json",
      automaticLayout: true,
      ariaLabel: "Data Masking Policy",
      fontSize: 13,
      minimap: { enabled: false },
      wordWrap: "off",
      scrollBeyondLastLine: false,
      lineNumbers: "on",
    });
    if (this.dataMaskingEditor) {
      const dataMaskingEditorModel = this.dataMaskingEditor.getModel();
      dataMaskingEditorModel.onDidChangeContent(this.onEditorContentChange.bind(this));
    }
  }

  private onEditorContentChange = (): void => {
    const dataMaskingEditorModel = this.dataMaskingEditor.getModel();
    try {
      const newContent = JSON.parse(dataMaskingEditorModel.getValue()) as DataModels.DataMaskingPolicy;

      // Always call parent's validation - it will handle validation and store errors
      this.props.onDataMaskingContentChange(newContent);

      const isDirty = isContentDirty(newContent, this.props.dataMaskingContentBaseline);
      this.setState(
        {
          dataMaskingContentIsValid: this.props.validationErrors.length === 0,
          isDirty,
        },
        () => {
          this.props.onDataMaskingDirtyChange(isDirty);
        },
      );
    } catch (e) {
      // Invalid JSON - mark as invalid without propagating
      this.setState({
        dataMaskingContentIsValid: false,
        isDirty: false,
      });
    }
  };

  public render(): JSX.Element {
    if (!isCapabilityEnabled(Constants.CapabilityNames.EnableDynamicDataMasking)) {
      return null;
    }

    const isDirty = this.IsComponentDirty();
    return (
      <Stack {...titleAndInputStackProps}>
        {isDirty && (
          <MessageBar messageBarType={MessageBarType.warning}>{unsavedEditorWarningMessage("dataMasking")}</MessageBar>
        )}
        {this.props.validationErrors.length > 0 && (
          <MessageBar messageBarType={MessageBarType.error}>
            Validation failed: {this.props.validationErrors.join(", ")}
          </MessageBar>
        )}
        <div className="settingsV2Editor" tabIndex={0} ref={this.dataMaskingDiv}></div>
      </Stack>
    );
  }
}
