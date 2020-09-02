import * as React from "react";
import { AccessibleElement } from "../../AccessibleElement/AccessibleElement";
import TriangleRight from "../../../../../images/Triangle-right.svg";
import TriangleDown from "../../../../../images/Triangle-down.svg";
import InfoBubble from "../../../../../images/info-bubble.svg";
import { StatefulValue } from "../../StatefulValue";
import * as ViewModels from "../../../../Contracts/ViewModels";
import * as DataModels from "../../../../Contracts/DataModels";
import Explorer from "../../../Explorer";

export interface ConflictResolutionComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;
  tabId: string;
  conflictResolutionPolicyMode: StatefulValue<DataModels.ConflictResolutionMode>;
  conflictResolutionPolicyPath: StatefulValue<string>;
  conflictResolutionPolicyProcedure: StatefulValue<string>;
  onConflictResolutionChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onConflictResolutionLWWKeyPress: () => void;
  onConflictResolutionPolicyPathChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onConflictResolutionCustomKeyPress: () => void;
  onConflictResolutionPolicyProcedureChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ConflictResolutionComponentState {
  conflictResolutionExpanded: boolean;
}

export class ConflictResolutionComponent extends React.Component<
  ConflictResolutionComponentProps,
  ConflictResolutionComponentState
> {
  public conflictResolutionPolicyModeCustomId: string;
  public conflictResolutionPolicyModeCRDTId: string;
  public conflictResolutionPolicyModeLWWId: string;

  constructor(props: ConflictResolutionComponentProps) {
    super(props);
    this.state = {
      conflictResolutionExpanded: true
    };
    this.conflictResolutionPolicyModeCustomId = `conflictResolutionPolicyModeCustom${this.props.tabId}`;
    this.conflictResolutionPolicyModeLWWId = `conflictResolutionPolicyModeLWW${this.props.tabId}`;
    this.conflictResolutionPolicyModeCRDTId = `conflictResolutionPolicyModeCRDT${this.props.tabId}`;
  }

  private toggleConflictResolution = (): void => {
    this.setState({ conflictResolutionExpanded: !this.state.conflictResolutionExpanded });
  };

  private getConflictResolutionModeComponent = (): JSX.Element => {
    return (
      <>
        <div className="formTitle">Mode</div>
        <div className="tabs" aria-label="Mode" role="radiogroup">
          <div className="tab">
            <AccessibleElement
              as="label"
              aria-label="ConflictResolutionLWWLabel"
              tabIndex={0}
              role="radio"
              aria-checked={
                this.props.conflictResolutionPolicyMode.current !== DataModels.ConflictResolutionMode.LastWriterWins
                  ? "true"
                  : "false"
              }
              className={`${this.props.conflictResolutionPolicyMode.isDirty() ? "dirty" : ""} ${
                this.props.conflictResolutionPolicyMode.current === DataModels.ConflictResolutionMode.LastWriterWins
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onActivated={this.props.onConflictResolutionLWWKeyPress}
            >
              Last Write Wins (default)
            </AccessibleElement>
            <input
              type="radio"
              name="conflictresolution"
              value={DataModels.ConflictResolutionMode.LastWriterWins}
              className="radio"
              id={this.conflictResolutionPolicyModeLWWId}
              onChange={this.props.onConflictResolutionChange}
              checked={
                this.props.conflictResolutionPolicyMode.current === DataModels.ConflictResolutionMode.LastWriterWins
              }
            />
          </div>

          <div className="tab">
            <AccessibleElement
              as="label"
              aria-label="ConflictResolutionCutomLabel"
              tabIndex={0}
              role="radio"
              aria-checked={
                this.props.conflictResolutionPolicyMode.current === DataModels.ConflictResolutionMode.Custom
                  ? "true"
                  : "false"
              }
              className={`${this.props.conflictResolutionPolicyMode.isDirty() ? "dirty" : ""} ${
                this.props.conflictResolutionPolicyMode.current === DataModels.ConflictResolutionMode.Custom
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onActivated={this.props.onConflictResolutionCustomKeyPress}
            >
              Merge Procedure (custom)
            </AccessibleElement>
            <input
              type="radio"
              name="conflictresolution"
              value={DataModels.ConflictResolutionMode.Custom}
              className="radio"
              id={this.conflictResolutionPolicyModeCustomId}
              onChange={this.props.onConflictResolutionChange}
              checked={this.props.conflictResolutionPolicyMode.current === DataModels.ConflictResolutionMode.Custom}
            />
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
        <p>
          <input
            type="text"
            aria-label="Document path for conflict resolution"
            value={
              this.props.conflictResolutionPolicyPath.current === undefined
                ? ""
                : this.props.conflictResolutionPolicyPath.current
            }
            className={`${this.props.conflictResolutionPolicyPath.isDirty() ? "dirty" : ""}`}
            onChange={this.props.onConflictResolutionPolicyPathChange}
          />
        </p>
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
        <p>
          <input
            type="text"
            aria-label="Stored procedure name for conflict resolution"
            value={
              this.props.conflictResolutionPolicyProcedure.current === undefined
                ? ""
                : this.props.conflictResolutionPolicyProcedure.current
            }
            className={`${this.props.conflictResolutionPolicyProcedure.isDirty() ? "dirty" : ""}`}
            onChange={this.props.onConflictResolutionPolicyProcedureChange}
          />
        </p>
      </>
    );
  };

  public render() {
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
