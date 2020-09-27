import * as React from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";
import * as DataModels from "../../../../Contracts/DataModels";
import Explorer from "../../../Explorer";
import {
  getTextFieldStyles,
  conflictResolutionLwwTooltip,
  conflictResolutionCustomToolTip,
  subComponentStackProps,
  getChoiceGroupStyles
} from "../SettingsRenderUtils";
import { TextField, ITextFieldProps, Stack, IChoiceGroupOption, ChoiceGroup } from "office-ui-fabric-react";
import { ToolTipLabelComponent } from "./ToolTipLabelComponent";
import { isDirty } from "../SettingsUtils";

export interface ConflictResolutionComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;
  conflictResolutionPolicyMode: DataModels.ConflictResolutionMode;
  conflictResolutionPolicyModeBaseline: DataModels.ConflictResolutionMode;
  onConflictResolutionPolicyModeChange: (
    event?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ) => void;
  conflictResolutionPolicyPath: string;
  conflictResolutionPolicyPathBaseline: string;

  onConflictResolutionPolicyPathChange: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => void;
  conflictResolutionPolicyProcedure: string;
  conflictResolutionPolicyProcedureBaseline: string;

  onConflictResolutionPolicyProcedureChange: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => void;
  onConflictResolutionDirtyChange: (isConflictResolutionDirty: boolean) => void;
}

export class ConflictResolutionComponent extends React.Component<ConflictResolutionComponentProps> {
  private shouldCheckComponentIsDirty = true;
  private conflictResolutionChoiceGroupOptions: IChoiceGroupOption[] = [
    {
      key: DataModels.ConflictResolutionMode.LastWriterWins,
      text: "Last Write Wins (default)"
    },
    { key: DataModels.ConflictResolutionMode.Custom, text: "Merge Procedure (custom)" }
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
    this.props.onConflictResolutionDirtyChange(this.IsComponentDirty())
    this.shouldCheckComponentIsDirty = false;
  };

  public IsComponentDirty = () : boolean => {
    if (
      isDirty(this.props.conflictResolutionPolicyMode, this.props.conflictResolutionPolicyModeBaseline) ||
      isDirty(this.props.conflictResolutionPolicyPath, this.props.conflictResolutionPolicyPathBaseline) ||
      isDirty(this.props.conflictResolutionPolicyProcedure, this.props.conflictResolutionPolicyProcedureBaseline)
    ) {
      return true
    }
    return false
  }

  private getConflictResolutionModeComponent = (): JSX.Element => (
    <ChoiceGroup
      label="Mode"
      selectedKey={this.props.conflictResolutionPolicyMode}
      options={this.conflictResolutionChoiceGroupOptions}
      onChange={this.props.onConflictResolutionPolicyModeChange}
      styles={getChoiceGroupStyles(
        this.props.conflictResolutionPolicyMode,
        this.props.conflictResolutionPolicyModeBaseline
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
        this.props.conflictResolutionPolicyPathBaseline
      )}
      value={this.props.conflictResolutionPolicyPath}
      onChange={this.props.onConflictResolutionPolicyPathChange}
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
        this.props.conflictResolutionPolicyProcedureBaseline
      )}
      value={this.props.conflictResolutionPolicyProcedure}
      onChange={this.props.onConflictResolutionPolicyProcedureChange}
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
