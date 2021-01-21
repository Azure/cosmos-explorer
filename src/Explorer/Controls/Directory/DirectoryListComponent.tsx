import _ from "underscore";
import * as React from "react";

import { DefaultButton, IButtonProps } from "office-ui-fabric-react/lib/Button";
import { List } from "office-ui-fabric-react/lib/List";
import { ScrollablePane } from "office-ui-fabric-react/lib/ScrollablePane";
import { Sticky, StickyPositionType } from "office-ui-fabric-react/lib/Sticky";
import { TextField, ITextFieldProps } from "office-ui-fabric-react/lib/TextField";
import { Tenant } from "../../../Contracts/DataModels";

export interface DirectoryListProps {
  directories: Array<Tenant>;
  selectedDirectoryId: string;
  onNewDirectorySelected: (newDirectory: Tenant) => void;
}

export interface DirectoryListComponentState {
  filterText: string;
}

// onRenderCell is not called when selectedDirectoryId changed, so add a selected state to force render
interface ListTenant extends Tenant {
  selected?: boolean;
}

export class DirectoryListComponent extends React.Component<DirectoryListProps, DirectoryListComponentState> {
  constructor(props: DirectoryListProps) {
    super(props);

    this.state = {
      filterText: ""
    };
  }

  public render(): JSX.Element {
    const { directories: originalItems, selectedDirectoryId } = this.props;
    const { filterText } = this.state;
    const filteredItems =
      originalItems && originalItems.length && filterText
        ? originalItems.filter(
            directory =>
              directory.displayName &&
              directory.displayName.toLowerCase().indexOf(filterText && filterText.toLowerCase()) >= 0
          )
        : originalItems;
    const filteredItemsSelected = filteredItems.map(t => {
      let tenant: ListTenant = t;
      tenant.selected = t.tenantId === selectedDirectoryId;
      return tenant;
    });

    const textFieldProps: ITextFieldProps = {
      className: "directoryListFilterTextBox",
      placeholder: "Filter by directory name",
      onChange: this._onFilterChanged,
      ariaLabel: "Directory filter text box"
    };

    // TODO: add magnify glass to search bar with onRenderSuffix
    return (
      <ScrollablePane data-is-scrollable="true">
        <Sticky stickyPosition={StickyPositionType.Header}>
          <TextField {...textFieldProps} />
        </Sticky>
        <List items={filteredItemsSelected} onRenderCell={this._onRenderCell} />
      </ScrollablePane>
    );
  }

  private _onFilterChanged = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text?: string): void => {
    this.setState({
      filterText: text
    });
  };

  private _onRenderCell = (directory: ListTenant): JSX.Element => {
    const buttonProps: IButtonProps = {
      disabled: directory.selected || false,
      className: "directoryListButton",
      onClick: this._onNewDirectoryClick,
      styles: {
        root: {
          backgroundColor: "transparent",
          height: "auto",
          borderBottom: "1px solid #ccc",
          padding: "1px 0",
          width: "100%"
        },
        rootDisabled: {
          backgroundColor: "#f1f1f8"
        },
        rootHovered: {
          backgroundColor: "rgba(85,179,255,.1)"
        },
        flexContainer: {
          height: "auto",
          justifyContent: "flex-start"
        }
      }
    };

    return (
      <DefaultButton {...buttonProps}>
        <div className="directoryListItem" data-is-focusable={true}>
          <div className="directoryListItemName">{directory.displayName}</div>
          <div className="directoryListItemId">{directory.tenantId}</div>
        </div>
      </DefaultButton>
    );
  };

  private _onNewDirectoryClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (!e || !e.currentTarget) {
      return;
    }
    const buttonElement = e.currentTarget;
    const selectedDirectoryId = buttonElement.getElementsByClassName("directoryListItemId")[0].textContent;
    const selectedDirectory = _.find(this.props.directories, d => d.tenantId === selectedDirectoryId);

    this.props.onNewDirectorySelected(selectedDirectory);
  };
}
