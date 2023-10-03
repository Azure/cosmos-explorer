import { ChoiceGroup, IChoiceGroupOption, ITextFieldProps, Stack, TextField } from "@fluentui/react";
import * as React from "react";
import * as DataModels from "../../../../Contracts/DataModels";
import * as ViewModels from "../../../../Contracts/ViewModels";
import {
  conflictResolutionCustomToolTip,
  conflictResolutionLwwTooltip,
  getChoiceGroupStyles,
  getTextFieldStyles,
  subComponentStackProps,
} from "../SettingsRenderUtils";
import { isDirty } from "../SettingsUtils";
import { ToolTipLabelComponent } from "./ToolTipLabelComponent";

export interface ConflictResolutionComponentProps {
  collection: ViewModels.Collection;
  conflictResolutionPolicyMode: DataModels.ConflictResolutionMode;
  conflictResolutionPolicyModeBaseline: DataModels.ConflictResolutionMode;
  onConflictResolutionPolicyModeChange: (newMode: DataModels.ConflictResolutionMode) => void;
  conflictResolutionPolicyPath: string;
  conflictResolutionPolicyPathBaseline: string;

  onConflictResolutionPolicyPathChange: (newPath: string) => void;
  conflictResolutionPolicyProcedure: string;
  conflictResolutionPolicyProcedureBaseline: string;

  onConflictResolutionPolicyProcedureChange: (newProcedure: string) => void;
  onConflictResolutionDirtyChange: (isConflictResolutionDirty: boolean) => void;
}

export class ConflictResolutionComponent extends React.Component<ConflictResolutionComponentProps> {
  private shouldCheckComponentIsDirty = true;
  private conflictResolutionChoiceGroupOptions: IChoiceGroupOption[] = [
    {
      key: DataModels.ConflictResolutionMode.LastWriterWins,
      text: "Last Write Wins (default)",
    },
    { key: DataModels.ConflictResolutionMode.Custom, text: "Merge Procedure (custom)" },
  ];

  componentDidMount(): void {
    this.onComponentUpdate();
  }

  componentDidUpdate(): void {
    this.onComponentUpdate();
  }

  private onComponentUpdate = (): void => {
    if (!this.shouldCheckComponentIsDirty) {
      this.shouldCheckComponentIsDirty = true;
      return;
    }
    this.props.onConflictResolutionDirtyChange(this.IsComponentDirty());
    this.shouldCheckComponentIsDirty = false;
  };

  public IsComponentDirty = (): boolean => {
    if (
      isDirty(this.props.conflictResolutionPolicyMode, this.props.conflictResolutionPolicyModeBaseline) ||
      isDirty(this.props.conflictResolutionPolicyPath, this.props.conflictResolutionPolicyPathBaseline) ||
      isDirty(this.props.conflictResolutionPolicyProcedure, this.props.conflictResolutionPolicyProcedureBaseline)
    ) {
      return true;
    }
    return false;
  };

  private onConflictResolutionPolicyModeChange = (
    event?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption,
  ): void =>
    this.props.onConflictResolutionPolicyModeChange(
      DataModels.ConflictResolutionMode[option.key as keyof typeof DataModels.ConflictResolutionMode],
    );

  private onConflictResolutionPolicyPathChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => this.props.onConflictResolutionPolicyPathChange(newValue);

  private onConflictResolutionPolicyProcedureChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => this.props.onConflictResolutionPolicyProcedureChange(newValue);

  private getConflictResolutionModeComponent = (): JSX.Element => (
    <ChoiceGroup
      label="Mode"
      selectedKey={this.props.conflictResolutionPolicyMode}
      options={this.conflictResolutionChoiceGroupOptions}
      onChange={this.onConflictResolutionPolicyModeChange}
      styles={getChoiceGroupStyles(
        this.props.conflictResolutionPolicyMode,
        this.props.conflictResolutionPolicyModeBaseline,
      )}
    />
  );

  private onRenderLwwComponentTextField = (props: ITextFieldProps) => (
    <ToolTipLabelComponent label={props.label} toolTipElement={conflictResolutionLwwTooltip} />
  );

  private getConflictResolutionLWWComponent = (): JSX.Element => (
    <TextField
      id="conflictResolutionLwwTextField"
      label={"Conflict Resolver Property"}
      onRenderLabel={this.onRenderLwwComponentTextField}
      styles={getTextFieldStyles(
        this.props.conflictResolutionPolicyPath,
        this.props.conflictResolutionPolicyPathBaseline,
      )}
      value={this.props.conflictResolutionPolicyPath}
      onChange={this.onConflictResolutionPolicyPathChange}
    />
  );

  private onRenderCustomComponentTextField = (props: ITextFieldProps) => (
    <ToolTipLabelComponent label={props.label} toolTipElement={conflictResolutionCustomToolTip} />
  );

  private getConflictResolutionCustomComponent = (): JSX.Element => (
    <TextField
      id="conflictResolutionCustomTextField"
      label="Stored procedure"
      onRenderLabel={this.onRenderCustomComponentTextField}
      styles={getTextFieldStyles(
        this.props.conflictResolutionPolicyProcedure,
        this.props.conflictResolutionPolicyProcedureBaseline,
      )}
      value={this.props.conflictResolutionPolicyProcedure}
      onChange={this.onConflictResolutionPolicyProcedureChange}
    />
  );

  public render(): JSX.Element {
    return (
      <Stack {...subComponentStackProps}>
        {this.getConflictResolutionModeComponent()}

        {this.props.conflictResolutionPolicyMode === DataModels.ConflictResolutionMode.LastWriterWins &&
          this.getConflictResolutionLWWComponent()}

        {this.props.conflictResolutionPolicyMode === DataModels.ConflictResolutionMode.Custom &&
          this.getConflictResolutionCustomComponent()}
      </Stack>
    );
  }
}
