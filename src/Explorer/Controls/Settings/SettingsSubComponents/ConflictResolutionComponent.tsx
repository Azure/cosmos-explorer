import * as React from "react";
import { StatefulValue } from "../../StatefulValue/StatefulValue";
import * as ViewModels from "../../../../Contracts/ViewModels";
import * as DataModels from "../../../../Contracts/DataModels";
import Explorer from "../../../Explorer";
import {
  getTextFieldStyles,
  conflictResolutionLwwTooltip,
  conflictResolutionCustomToolTip,
  subComponentStackProps,
  getChoiceGroupStyles,
  choiceGroupOptionStyles
} from "../SettingsRenderUtils";
import {
  TextField,
  ITextFieldProps,
  Stack,
  IChoiceGroupOption,
  ChoiceGroup
} from "office-ui-fabric-react";
import { ToolTipLabelComponent } from "./ToolTipLabelComponent";

export interface ConflictResolutionComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;
  conflictResolutionPolicyMode: StatefulValue<DataModels.ConflictResolutionMode>;
  onConflictResolutionPolicyModeChange: (
    event?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ) => void;
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
  private conflictResolutionChoiceGroupOptions: IChoiceGroupOption[] = [
    {
      key: DataModels.ConflictResolutionMode.LastWriterWins,
      text: "Last Write Wins (default)",
      styles: choiceGroupOptionStyles
    },
    { key: DataModels.ConflictResolutionMode.Custom, text: "Merge Procedure (custom)", styles: choiceGroupOptionStyles }
  ];

  private getConflictResolutionModeComponent = (): JSX.Element => {
    return (
      <ChoiceGroup
        label="Mode"
        tabIndex={0}
        selectedKey={this.props.conflictResolutionPolicyMode.current}
        options={this.conflictResolutionChoiceGroupOptions}
        onChange={this.props.onConflictResolutionPolicyModeChange}
        styles={getChoiceGroupStyles(this.props.conflictResolutionPolicyMode)}
      />
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
