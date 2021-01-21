/**
 * React component for Switch Directory
 */

import _ from "underscore";
import * as React from "react";
import { Dropdown, IDropdownOption, IDropdownProps } from "office-ui-fabric-react/lib/Dropdown";
import { Tenant } from "../../../Contracts/DataModels";

export interface DefaultDirectoryDropdownProps {
  directories: Array<Tenant>;
  defaultDirectoryId: string;
  onDefaultDirectoryChange: (newDirectory: Tenant) => void;
}

export class DefaultDirectoryDropdownComponent extends React.Component<DefaultDirectoryDropdownProps> {
  public static readonly lastVisitedKey: string = "lastVisited";

  public render(): JSX.Element {
    const lastVisitedOption: IDropdownOption = {
      key: DefaultDirectoryDropdownComponent.lastVisitedKey,
      text: "Sign in to your last visited directory",
    };
    const directoryOptions: Array<IDropdownOption> = this.props.directories.map(
      (dirc): IDropdownOption => {
        return {
          key: dirc.tenantId,
          text: `${dirc.displayName}(${dirc.tenantId})`,
        };
      }
    );
    const dropDownOptions: Array<IDropdownOption> = [lastVisitedOption, ...directoryOptions];
    const dropDownProps: IDropdownProps = {
      label: "Set your default directory",
      options: dropDownOptions,
      defaultSelectedKey: this.props.defaultDirectoryId ? this.props.defaultDirectoryId : lastVisitedOption.key,
      onChange: this._onDropdownChange,
      className: "defaultDirectoryDropdown",
    };

    return <Dropdown {...dropDownProps} />;
  }

  private _onDropdownChange = (e: React.FormEvent<HTMLDivElement>, option?: IDropdownOption, index?: number): void => {
    if (!option || !option.key) {
      return;
    }

    if (option.key === this.props.defaultDirectoryId) {
      return;
    }

    if (option.key === DefaultDirectoryDropdownComponent.lastVisitedKey) {
      this.props.onDefaultDirectoryChange({
        tenantId: option.key,
        countryCode: undefined,
        displayName: undefined,
        domains: [],
        id: undefined,
      });
      return;
    }

    const selectedDirectory = _.find(this.props.directories, (d) => d.tenantId === option.key);
    if (!selectedDirectory) {
      return;
    }

    this.props.onDefaultDirectoryChange(selectedDirectory);
  };
}
