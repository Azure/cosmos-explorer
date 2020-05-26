/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/

import IToolbarDisplayable from "./IToolbarDisplayable";

interface IToolbarDropDown extends IToolbarDisplayable {
  type: "dropdown";
  subgroup: IActionConfigItem[];
  expanded: ko.Observable<boolean>;
  open: () => void;
}

export interface IDropdown {
  type: "dropdown";
  title: string;
  displayName: string;
  id: string;
  enabled: ko.Observable<boolean>;
  visible?: ko.Observable<boolean>;
  icon?: string;
  subgroup?: IActionConfigItem[];
}

export interface ISeperator {
  type: "separator";
  visible?: ko.Observable<boolean>;
}

export interface IToggle {
  type: "toggle";
  title: string;
  displayName: string;
  checkedTitle: string;
  checkedDisplayName: string;
  id: string;
  checked: ko.Observable<boolean>;
  enabled: ko.Observable<boolean>;
  visible?: ko.Observable<boolean>;
  icon?: string;
}

export interface IAction {
  type: "action";
  title: string;
  displayName: string;
  id: string;
  action: () => any;
  enabled: ko.Subscribable<boolean>;
  visible?: ko.Observable<boolean>;
  icon?: string;
}

export type IActionConfigItem = ISeperator | IAction | IToggle | IDropdown;

export default IToolbarDropDown;
