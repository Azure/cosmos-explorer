import { getTheme, MessageBar, MessageBarType, Stack } from "@fluentui/react";
import * as React from "react";
import * as Constants from "../../../../Common/Constants";
import * as DataModels from "../../../../Contracts/DataModels";
import { isCapabilityEnabled } from "../../../../Utils/CapabilityUtils";
import { EditorReact } from "../../../Controls/Editor/EditorReact";
import { titleAndInputStackProps, unsavedEditorWarningMessage } from "../SettingsRenderUtils";
import { isDirty as isContentDirty } from "../SettingsUtils";

export interface DataMaskingComponentProps {
  shouldDiscardDataMasking: boolean;
  resetShouldDiscardDataMasking: () => void;
  dataMaskingContent: DataModels.DataMaskingPolicy;
  dataMaskingContentBaseline: DataModels.DataMaskingPolicy;
  onDataMaskingContentChange: (dataMasking: DataModels.DataMaskingPolicy) => void;
  onDataMaskingDirtyChange: (isDirty: boolean) => void;
}

interface DataMaskingComponentState {
  isDirty: boolean;
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
  private editorRef: React.RefObject<EditorReact>;

  constructor(props: DataMaskingComponentProps) {
    super(props);
    this.state = {
      isDirty: false,
    };
    this.editorRef = React.createRef();

    if (props.shouldDiscardDataMasking) {
      const baselinePolicy = props.dataMaskingContentBaseline || emptyDataMaskingPolicy;
      props.onDataMaskingContentChange({ ...baselinePolicy });
      props.onDataMaskingDirtyChange(false);
      props.resetShouldDiscardDataMasking();
    }
  }

  private onBeforeChange = () => {
    this.props.resetShouldDiscardDataMasking();
  };

  private onContentChange = (content: string): void => {
    try {
      const parsedContent = JSON.parse(content);

      if (!Array.isArray(parsedContent.includedPaths)) {
        return;
      }
      if (typeof parsedContent.policyFormatVersion !== "number") {
        return;
      }
      if (typeof parsedContent.isPolicyEnabled !== "boolean") {
        return;
      }

      this.props.onDataMaskingContentChange(parsedContent);
      const dirty = JSON.stringify(parsedContent) !== JSON.stringify(this.props.dataMaskingContentBaseline);
      this.props.onDataMaskingDirtyChange(dirty);

      this.setState({ isDirty: dirty });
    } catch (error) {
      // Ignore errors as they just mean invalid JSON that shouldn't be processed
    }
  };

  public componentDidUpdate(prevProps: DataMaskingComponentProps): void {
    if (this.props.shouldDiscardDataMasking && this.editorRef.current?.editor) {
      const baselinePolicy = this.props.dataMaskingContentBaseline || emptyDataMaskingPolicy;
      // First update the content through props
      this.props.onDataMaskingContentChange({ ...baselinePolicy });

      // Then update the editor value
      const baselineContent = JSON.stringify(baselinePolicy, undefined, 2);
      this.editorRef.current.editor.setValue(baselineContent);

      this.setState({ isDirty: false });
      this.props.onDataMaskingDirtyChange(false);
      this.props.resetShouldDiscardDataMasking();
    }

    if (prevProps.dataMaskingContentBaseline !== this.props.dataMaskingContentBaseline) {
      const dirty = isContentDirty(this.props.dataMaskingContent, this.props.dataMaskingContentBaseline);
      if (dirty !== this.state.isDirty) {
        this.setState({ isDirty: dirty });
        this.props.onDataMaskingDirtyChange(dirty);
      }
    }
  }

  private getEditorContent(): string {
    if (this.props.dataMaskingContent) {
      return JSON.stringify(this.props.dataMaskingContent, undefined, 2);
    }

    return `// Data Masking Policy Template
{
  // Paths to apply data masking - required
  "includedPaths": [
    {
      "path": "/sensitiveField",      // JSON path to the field to mask
      "strategy": "Default",          // Masking strategy: Default, Hash, etc.
      "startPosition": 0,             // Starting position for partial masking
      "length": -1                    // Length to mask (-1 for entire field)
    }
  ],
  // Paths to exclude from masking - optional
  "excludedPaths": [],
  // Version of the policy format - required
  "policyFormatVersion": 2,
  // Enable/disable the entire policy
  "isPolicyEnabled": false
}`;
  }

  public render(): JSX.Element {
    if (!isCapabilityEnabled(Constants.CapabilityNames.EnableDynamicDataMasking)) {
      return null;
    }

    const theme = getTheme();
    return (
      <Stack {...titleAndInputStackProps}>
        {this.state.isDirty && (
          <MessageBar messageBarType={MessageBarType.warning}>{unsavedEditorWarningMessage("dataMasking")}</MessageBar>
        )}
        <EditorReact
          ariaLabel="Data Masking Policy Editor"
          content={this.getEditorContent()}
          isReadOnly={false}
          language="json"
          onContentChanged={this.onContentChange}
          theme={theme?.isInverted ? "cosmos-dark" : "cosmos-light"}
          lineNumbers="on"
          monacoContainerStyles={{ height: "500px" }}
          ref={this.editorRef}
        />
      </Stack>
    );
  }
}
