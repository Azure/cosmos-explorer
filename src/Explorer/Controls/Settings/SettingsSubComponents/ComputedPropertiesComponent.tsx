import { FontIcon, Link, MessageBar, MessageBarType, Stack, Text } from "@fluentui/react";
import * as DataModels from "Contracts/DataModels";
import { titleAndInputStackProps, unsavedEditorWarningMessage } from "Explorer/Controls/Settings/SettingsRenderUtils";
import { isDirty } from "Explorer/Controls/Settings/SettingsUtils";
import { loadMonaco } from "Explorer/LazyMonaco";
import * as monaco from "monaco-editor";
import * as React from "react";

export interface ComputedPropertiesComponentProps {
  computedPropertiesContent: DataModels.ComputedProperties;
  computedPropertiesContentBaseline: DataModels.ComputedProperties;
  logComputedPropertiesSuccessMessage: () => void;
  onComputedPropertiesContentChange: (newComputedProperties: DataModels.ComputedProperties) => void;
  onComputedPropertiesDirtyChange: (isComputedPropertiesDirty: boolean) => void;
  resetShouldDiscardComputedProperties: () => void;
  shouldDiscardComputedProperties: boolean;
}

interface ComputedPropertiesComponentState {
  computedPropertiesContentIsValid: boolean;
}

export class ComputedPropertiesComponent extends React.Component<
  ComputedPropertiesComponentProps,
  ComputedPropertiesComponentState
> {
  private shouldCheckComponentIsDirty = true;
  private computedPropertiesDiv = React.createRef<HTMLDivElement>();
  private computedPropertiesEditor: monaco.editor.IStandaloneCodeEditor;

  constructor(props: ComputedPropertiesComponentProps) {
    super(props);
    this.state = {
      computedPropertiesContentIsValid: true,
    };
  }

  componentDidUpdate(): void {
    if (this.props.shouldDiscardComputedProperties) {
      this.resetComputedPropertiesEditor();
      this.props.resetShouldDiscardComputedProperties();
    }
    this.onComponentUpdate();
  }

  componentDidMount(): void {
    this.resetComputedPropertiesEditor();
    this.onComponentUpdate();
  }

  public resetComputedPropertiesEditor = (): void => {
    if (!this.computedPropertiesEditor) {
      this.createComputedPropertiesEditor();
    } else {
      const indexingPolicyEditorModel = this.computedPropertiesEditor.getModel();
      const value: string = JSON.stringify(this.props.computedPropertiesContent, undefined, 4);
      indexingPolicyEditorModel.setValue(value);
    }
    this.onComponentUpdate();
  };

  private onComponentUpdate = (): void => {
    if (!this.shouldCheckComponentIsDirty) {
      this.shouldCheckComponentIsDirty = true;
      return;
    }
    this.props.onComputedPropertiesDirtyChange(this.IsComponentDirty());
    this.shouldCheckComponentIsDirty = false;
  };

  public IsComponentDirty = (): boolean => {
    if (
      isDirty(this.props.computedPropertiesContent, this.props.computedPropertiesContentBaseline) &&
      this.state.computedPropertiesContentIsValid
    ) {
      return true;
    }

    return false;
  };

  private async createComputedPropertiesEditor(): Promise<void> {
    const value: string = JSON.stringify(this.props.computedPropertiesContent, undefined, 4);
    const monaco = await loadMonaco();
    this.computedPropertiesEditor = monaco.editor.create(this.computedPropertiesDiv.current, {
      value: value,
      language: "json",
      ariaLabel: "Computed properties",
    });
    if (this.computedPropertiesEditor) {
      const computedPropertiesEditorModel = this.computedPropertiesEditor.getModel();
      computedPropertiesEditorModel.onDidChangeContent(this.onEditorContentChange.bind(this));
      this.props.logComputedPropertiesSuccessMessage();
    }
  }

  private onEditorContentChange = (): void => {
    const computedPropertiesEditorModel = this.computedPropertiesEditor.getModel();
    try {
      const newComputedPropertiesContent = JSON.parse(
        computedPropertiesEditorModel.getValue(),
      ) as DataModels.ComputedProperties;
      this.props.onComputedPropertiesContentChange(newComputedPropertiesContent);
      this.setState({ computedPropertiesContentIsValid: true });
    } catch (e) {
      this.setState({ computedPropertiesContentIsValid: false });
    }
  };

  public render(): JSX.Element {
    return (
      <Stack {...titleAndInputStackProps}>
        {isDirty(this.props.computedPropertiesContent, this.props.computedPropertiesContentBaseline) && (
          <MessageBar messageBarType={MessageBarType.warning}>
            {unsavedEditorWarningMessage("computedProperties")}
          </MessageBar>
        )}
        <Text style={{ marginLeft: "30px", marginBottom: "10px" }}>
          <Link target="_blank" href="https://aka.ms/computed-properties-preview/">
            {"Learn more"} <FontIcon iconName="NavigateExternalInline" />
          </Link>
          &#160; about how to define computed properties and how to use them.
        </Text>
        <div
          className="settingsV2Editor"
          tabIndex={0}
          ref={this.computedPropertiesDiv}
          data-test="computed-properties-editor"
        ></div>
      </Stack>
    );
  }
}
