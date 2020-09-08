import * as React from "react";
import { StatefulValue } from "../../StatefulValue/StatefulValue";
import * as ViewModels from "../../../../Contracts/ViewModels";
import * as DataModels from "../../../../Contracts/DataModels";
import Explorer from "../../../Explorer";
import * as Constants from "../../../../Common/Constants";
import {
  getTextFieldStyles,
  conflictResolutionLwwTooltip,
  conflictResolutionCustomToolTip,
  subComponentStackProps,
  titleAndInputStackProps
} from "../SettingsRenderUtils";
import { Label, Text, TextField, ITextFieldProps, Stack } from "office-ui-fabric-react";
import { ToolTipLabelComponent } from "./ToolTipLabelComponent";

export interface ConflictResolutionComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;
  conflictResolutionPolicyMode: StatefulValue<DataModels.ConflictResolutionMode>;
  onConflictResolutionPolicyModeChange: (mode: DataModels.ConflictResolutionMode) => void;
  conflictResolutionPolicyPath: StatefulValue<string>;
  onConflictResolutionPolicyPathChange: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => void;
  conflictResolutionPolicyProcedure: StatefulValue<string>;
  onConflictResolutionPolicyProcedureChange: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => void;
}

export class ConflictResolutionComponent extends React.Component<ConflictResolutionComponentProps> {
  private onConflictResolutionCustomKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.onConflictResolutionCustomClick();
    }
  };

  private onConflictResolutionCustomClick = (): void => {
    this.props.onConflictResolutionPolicyModeChange(DataModels.ConflictResolutionMode.Custom);
  };

  private onConflictResolutionLWWKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.onConflictResolutionLWWClick();
    }
  };

  private onConflictResolutionLWWClick = (): void => {
    this.props.onConflictResolutionPolicyModeChange(DataModels.ConflictResolutionMode.LastWriterWins);
  };

  private getConflictResolutionModeComponent = (): JSX.Element => {
    return (
      <Stack {...titleAndInputStackProps}>
        <Text>Mode</Text>
        <div className="tabs" aria-label="Mode" role="radiogroup">
          <div className="tab">
            <Label
              tabIndex={0}
              role="radio"
              className={`settingsV2Label ${this.props.conflictResolutionPolicyMode.isDirty() ? "dirty" : ""} ${
                this.props.conflictResolutionPolicyMode.current === DataModels.ConflictResolutionMode.LastWriterWins
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onKeyPress={this.onConflictResolutionLWWKeyPress}
              onClick={this.onConflictResolutionLWWClick}
            >
              Last Write Wins (default)
            </Label>
          </div>
          <div className="tab">
            <Label
              tabIndex={0}
              role="radio"
              className={`settingsV2Label ${this.props.conflictResolutionPolicyMode.isDirty() ? "dirty" : ""} ${
                this.props.conflictResolutionPolicyMode.current === DataModels.ConflictResolutionMode.Custom
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onKeyPress={this.onConflictResolutionCustomKeyPress}
              onClick={this.onConflictResolutionCustomClick}
            >
              Merge Procedure (custom)
            </Label>
          </div>
        </div>
      </Stack>
    );
  };

  private onRenderLwwComponentTextField = (props: ITextFieldProps) => (
    <ToolTipLabelComponent label={props.label} toolTipElement={conflictResolutionLwwTooltip} />
  );

  private getConflictResolutionLWWComponent = (): JSX.Element => {
    return (
      <TextField
        id="conflictResolutionLwwTextField"
        label={"Conflict Resolver Property"}
        onRenderLabel={this.onRenderLwwComponentTextField}
        styles={getTextFieldStyles(this.props.conflictResolutionPolicyPath)}
        value={this.props.conflictResolutionPolicyPath.current}
        onChange={this.props.onConflictResolutionPolicyPathChange}
      />
    );
  };

  private onRenderCustomComponentTextField = (props: ITextFieldProps) => (
    <ToolTipLabelComponent label={props.label} toolTipElement={conflictResolutionCustomToolTip} />
  );

  private getConflictResolutionCustomComponent = (): JSX.Element => {
    return (
      <TextField
        id="conflictResolutionCustomTextField"
        label="Stored procedure"
        onRenderLabel={this.onRenderCustomComponentTextField}
        styles={getTextFieldStyles(this.props.conflictResolutionPolicyProcedure)}
        value={this.props.conflictResolutionPolicyProcedure.current}
        onChange={this.props.onConflictResolutionPolicyProcedureChange}
      />
    );
  };

  public render(): JSX.Element {
    return (
      <Stack {...subComponentStackProps}>
        {this.getConflictResolutionModeComponent()}

        {this.props.conflictResolutionPolicyMode.current === DataModels.ConflictResolutionMode.LastWriterWins &&
          this.getConflictResolutionLWWComponent()}

        {this.props.conflictResolutionPolicyMode.current === DataModels.ConflictResolutionMode.Custom &&
          this.getConflictResolutionCustomComponent()}
      </Stack>
    );
  }
}
