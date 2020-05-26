import * as React from "react";
import { ArcadiaWorkspace, SparkPool } from "../../../Contracts/DataModels";
import { DefaultButton, IButtonStyles } from "office-ui-fabric-react/lib/Button";
import {
  IContextualMenuItem,
  IContextualMenuProps,
  ContextualMenuItemType
} from "office-ui-fabric-react/lib/ContextualMenu";
import { Logger } from "../../../Common/Logger";

export interface ArcadiaMenuPickerProps {
  selectText?: string;
  disableSubmenu?: boolean;
  selectedSparkPool: string;
  workspaces: ArcadiaWorkspaceItem[];
  onSparkPoolSelect: (
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    item: IContextualMenuItem
  ) => boolean | void;
  onCreateNewWorkspaceClicked: () => boolean | void;
  onCreateNewSparkPoolClicked: (workspaceResourceId: string) => boolean | void;
}

interface ArcadiaMenuPickerStates {
  selectedSparkPool: string;
}

export interface ArcadiaWorkspaceItem extends ArcadiaWorkspace {
  sparkPools: SparkPool[];
}

export class ArcadiaMenuPicker extends React.Component<ArcadiaMenuPickerProps, ArcadiaMenuPickerStates> {
  constructor(props: ArcadiaMenuPickerProps) {
    super(props);
    this.state = {
      selectedSparkPool: props.selectedSparkPool
    };
  }

  private _onSparkPoolClicked = (
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    item: IContextualMenuItem
  ): boolean | void => {
    try {
      this.props.onSparkPoolSelect(e, item);
      this.setState({
        selectedSparkPool: item.text
      });
    } catch (error) {
      Logger.logError(error, "ArcadiaMenuPicker/_onSparkPoolClicked");
      throw error;
    }
  };

  private _onCreateNewWorkspaceClicked = (
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    item: IContextualMenuItem
  ): boolean | void => {
    this.props.onCreateNewWorkspaceClicked();
  };

  private _onCreateNewSparkPoolClicked = (
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    item: IContextualMenuItem
  ): boolean | void => {
    this.props.onCreateNewSparkPoolClicked(item.key);
  };

  public render() {
    const { workspaces } = this.props;
    let workspaceMenuItems: IContextualMenuItem[] = workspaces.map(workspace => {
      let sparkPoolsMenuProps: IContextualMenuProps = {
        items: workspace.sparkPools.map(
          (sparkpool): IContextualMenuItem => ({
            key: sparkpool.id,
            text: sparkpool.name,
            onClick: this._onSparkPoolClicked
          })
        )
      };
      if (!sparkPoolsMenuProps.items.length) {
        sparkPoolsMenuProps.items.push({
          key: workspace.id,
          text: "Create new spark pool",
          onClick: this._onCreateNewSparkPoolClicked
        });
      }

      return {
        key: workspace.id,
        text: workspace.name,
        subMenuProps: this.props.disableSubmenu ? undefined : sparkPoolsMenuProps
      };
    });

    if (!workspaceMenuItems.length) {
      workspaceMenuItems.push({
        key: "create_workspace",
        text: "Create new workspace",
        onClick: this._onCreateNewWorkspaceClicked
      });
    }

    const dropdownStyle: IButtonStyles = {
      root: {
        backgroundColor: "transparent",
        margin: "auto 5px",
        padding: "0",
        border: "0"
      },
      rootHovered: {
        backgroundColor: "transparent"
      },
      rootChecked: {
        backgroundColor: "transparent"
      },
      rootFocused: {
        backgroundColor: "transparent"
      },
      rootExpanded: {
        backgroundColor: "transparent"
      },
      flexContainer: {
        height: "30px",
        border: "1px solid #a6a6a6",
        padding: "0 8px"
      },
      label: {
        fontWeight: "400",
        fontSize: "12px"
      }
    };

    return (
      <DefaultButton
        text={this.state.selectedSparkPool || this.props.selectText || "Select a Spark pool"}
        persistMenu={true}
        className="arcadia-menu-picker"
        menuProps={{
          items: workspaceMenuItems
        }}
        styles={dropdownStyle}
      />
    );
  }
}
