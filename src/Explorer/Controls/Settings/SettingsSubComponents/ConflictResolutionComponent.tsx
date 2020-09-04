import * as React from "react";
import { AccessibleElement } from "../../AccessibleElement/AccessibleElement";
import TriangleRight from "../../../../../images/Triangle-right.svg";
import TriangleDown from "../../../../../images/Triangle-down.svg";
import InfoBubble from "../../../../../images/info-bubble.svg";
import { StatefulValue } from "../../StatefulValue";
import * as ViewModels from "../../../../Contracts/ViewModels";
import * as DataModels from "../../../../Contracts/DataModels";
import Explorer from "../../../Explorer";
import * as Constants from "../../../../Common/Constants";
import { getTextFieldStyles } from "../SettingsRenderUtils";
import { Label, TextField, ITextFieldStyleProps, ITextFieldStyles } from "office-ui-fabric-react";

export interface ConflictResolutionComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;
  tabId: string;
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

interface ConflictResolutionComponentState {
  conflictResolutionExpanded: boolean;
}

export class ConflictResolutionComponent extends React.Component<
  ConflictResolutionComponentProps,
  ConflictResolutionComponentState
> {
  constructor(props: ConflictResolutionComponentProps) {
    super(props);
    this.state = {
      conflictResolutionExpanded: true
    };
  }

  private toggleConflictResolution = (): void => {
    this.setState({ conflictResolutionExpanded: !this.state.conflictResolutionExpanded });
  };

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
      <>
        <div className="formTitle">Mode</div>
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
      </>
    );
  };

  private getConflictResolutionLWWComponent = (): JSX.Element => {
    return (
      <>
        <p className="formTitle">
          Conflict Resolver Property
          <span className="infoTooltip" role="tooltip" tabIndex={0}>
            <img className="infoImg" src={InfoBubble} alt="More information" />
            <span className="tooltiptext infoTooltipWidth">
              Gets or sets the name of a integer property in your documents which is used for the Last Write Wins (LWW)
              based conflict resolution scheme. By default, the system uses the system defined timestamp property, _ts
              to decide the winner for the conflicting versions of the document. Specify your own integer property if
              you want to override the default timestamp based conflict resolution.
            </span>
          </span>
        </p>
        <TextField
          styles={getTextFieldStyles(this.props.conflictResolutionPolicyPath)}
          value={this.props.conflictResolutionPolicyPath.current}
          onChange={this.props.onConflictResolutionPolicyPathChange}
        />
      </>
    );
  };

  private getConflictResolutionCustomComponent = (): JSX.Element => {
    return (
      <>
        <p className="formTitle">
          Stored procedure
          <span className="infoTooltip" role="tooltip" tabIndex={0}>
            <img className="infoImg" src={InfoBubble} alt="More information" />
            <span className="tooltiptext infoTooltipWidth">
              Gets or sets the name of a stored procedure (aka merge procedure) for resolving the conflicts. You can
              write application defined logic to determine the winner of the conflicting versions of a document. The
              stored procedure will get executed transactionally, exactly once, on the server side. If you do not
              provide a stored procedure, the conflicts will be populated in the
              <a
                className="linkDarkBackground"
                href="https://aka.ms/dataexplorerconflics"
                rel="noreferrer"
                target="_blank"
              >
                {` conflicts feed`}
              </a>
              . You can update/re-register the stored procedure at any time.
            </span>
          </span>
        </p>
        <TextField
          styles={getTextFieldStyles(this.props.conflictResolutionPolicyProcedure)}
          value={this.props.conflictResolutionPolicyProcedure.current}
          onChange={this.props.onConflictResolutionPolicyProcedureChange}
        />
      </>
    );
  };

  public render(): JSX.Element {
    return (
      <>
        <AccessibleElement
          as="div"
          className="formTitle"
          onClick={this.toggleConflictResolution}
          onActivated={this.toggleConflictResolution}
          aria-expanded={this.state.conflictResolutionExpanded}
          role="button"
          tabIndex={0}
          aria-label="Conflict Resolution"
          aria-controls="conflictResolutionRegion"
        >
          {!this.state.conflictResolutionExpanded && (
            <span className="themed-images" id="ExpandChevronRightConflictResolution">
              <img
                className="imgiconwidth ssExpandCollapseIcon ssCollapseIcon"
                src={TriangleRight}
                alt="Show conflict resolution"
              />
            </span>
          )}

          {this.state.conflictResolutionExpanded && (
            <span className="themed-images" id="ExpandChevronDownConflictResolution">
              <img className="imgiconwidth ssExpandCollapseIcon" src={TriangleDown} alt="Show conflict resolution" />
            </span>
          )}
          <span className="scaleSettingTitle">Conflict resolution</span>
        </AccessibleElement>

        {this.state.conflictResolutionExpanded && (
          <div id="conflictResolutionRegion" className="ssTextAllignment">
            {this.getConflictResolutionModeComponent()}

            {this.props.conflictResolutionPolicyMode.current === DataModels.ConflictResolutionMode.LastWriterWins &&
              this.getConflictResolutionLWWComponent()}

            {this.props.conflictResolutionPolicyMode.current === DataModels.ConflictResolutionMode.Custom &&
              this.getConflictResolutionCustomComponent()}
          </div>
        )}
      </>
    );
  }
}
