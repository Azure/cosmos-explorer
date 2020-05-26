import * as ko from "knockout";
import * as React from "react";
import { DirectoryListComponent, DirectoryListProps } from "./DirectoryListComponent";
import { DefaultDirectoryDropdownComponent, DefaultDirectoryDropdownProps } from "./DefaultDirectoryDropdownComponent";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";

export class DirectoryComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;

  constructor(
    private _dropdownProps: ko.Observable<DefaultDirectoryDropdownProps>,
    private _listProps: ko.Observable<DirectoryListProps>
  ) {
    this._dropdownProps.subscribe(() => this.forceRender());
    this._listProps.subscribe(() => this.forceRender());
    this.parameters = ko.observable<number>(Date.now());
  }

  public renderComponent(): JSX.Element {
    return (
      <div>
        <div className="directoryDropdownContainer">
          <DefaultDirectoryDropdownComponent {...this._dropdownProps()} />
        </div>
        <div className="directoryDivider" />
        <div className="directoryListContainer">
          <DirectoryListComponent {...this._listProps()} />
        </div>
      </div>
    );
  }

  public forceRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
