import { FontIcon, IMessageBarStyles, Link, MessageBar, MessageBarType, Stack, Text } from "@fluentui/react";
import * as DataModels from "Contracts/DataModels";
import { titleAndInputStackProps, unsavedEditorWarningMessage } from "Explorer/Controls/Settings/SettingsRenderUtils";
import { isDirty } from "Explorer/Controls/Settings/SettingsUtils";
import { loadMonaco } from "Explorer/LazyMonaco";
import { monacoTheme, useThemeStore } from "hooks/useTheme";
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

  componentWillUnmount(): void {
    this.themeUnsubscribe && this.themeUnsubscribe();
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
      theme: monacoTheme(),
    });
    if (this.computedPropertiesEditor) {
      // Subscribe to theme changes
      this.themeUnsubscribe = useThemeStore.subscribe(() => {
        if (this.computedPropertiesEditor) {
          monaco.editor.setTheme(monacoTheme());
        }
      });

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
          <MessageBar
            messageBarType={MessageBarType.warning}
            messageBarIconProps={{ iconName: "WarningSolid", className: "messageBarWarningIcon" }}
            styles={this.darkThemeMessageBarStyles}
          >
            {unsavedEditorWarningMessage("computedProperties")}
          </MessageBar>
        )}
        <Text style={{ marginLeft: "30px", marginBottom: "10px", color: "var(--colorNeutralForeground1)" }}>
          <Link target="_blank" href="https://aka.ms/computed-properties-preview/">
            {"Learn more"} <FontIcon iconName="NavigateExternalInline" />
          </Link>
          &#160; about how to define computed properties and how to use them.
        </Text>
        <div className="settingsV2Editor" tabIndex={0} ref={this.computedPropertiesDiv}></div>
      </Stack>
    );
  }
}
