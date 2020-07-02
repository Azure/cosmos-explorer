/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/

import * as ko from "knockout";
import { IDropdown } from "./IToolbarDropDown";
import { IActionConfigItem } from "./IToolbarDropDown";
import IToolbarDropDown from "./IToolbarDropDown";
import KeyCodes from "./KeyCodes";
import Utilities from "./Utilities";

interface IMenuItem {
  id?: string;
  type: "normal" | "separator" | "submenu";
  label?: string;
  enabled?: boolean;
  visible?: boolean;
  submenu?: IMenuItem[];
}

export default class ToolbarDropDown implements IToolbarDropDown {
  public type: "dropdown" = "dropdown";
  public title: ko.Observable<string>;
  public displayName: ko.Observable<string>;
  public id: string;
  public enabled: ko.Observable<boolean>;
  public visible: ko.Observable<boolean>;
  public focused: ko.Observable<boolean>;
  public icon: string;
  public subgroup: IActionConfigItem[] = [];
  public expanded: ko.Observable<boolean> = ko.observable(false);
  private _afterExecute: (id: string) => void;

  constructor(dropdown: IDropdown, afterExecute?: (id: string) => void) {
    this.subgroup = dropdown.subgroup;
    this.title = ko.observable(dropdown.title);
    this.displayName = ko.observable(dropdown.displayName);
    this.id = dropdown.id;
    this.enabled = dropdown.enabled;
    this.visible = dropdown.visible ? dropdown.visible : ko.observable(true);
    this.focused = ko.observable(false);
    this.icon = dropdown.icon;
    this._afterExecute = afterExecute;
  }

  private static _convertToMenuItem = (
    actionConfigs: IActionConfigItem[],
    actionMap: { [id: string]: () => void } = {}
  ): { menuItems: IMenuItem[]; actionMap: { [id: string]: () => void } } => {
    var returnValue = {
      menuItems: actionConfigs.map<IMenuItem>((actionConfig: IActionConfigItem, index, array) => {
        var menuItem: IMenuItem;
        switch (actionConfig.type) {
          case "action":
            menuItem = <IMenuItem>{
              id: actionConfig.id,
              type: "normal",
              label: actionConfig.displayName,
              enabled: actionConfig.enabled(),
              visible: actionConfig.visible ? actionConfig.visible() : true,
            };
            actionMap[actionConfig.id] = actionConfig.action;
            break;
          case "dropdown":
            menuItem = <IMenuItem>{
              id: actionConfig.id,
              type: "submenu",
              label: actionConfig.displayName,
              enabled: actionConfig.enabled(),
              visible: actionConfig.visible ? actionConfig.visible() : true,
              submenu: ToolbarDropDown._convertToMenuItem(actionConfig.subgroup, actionMap).menuItems,
            };
            break;
          case "toggle":
            menuItem = <IMenuItem>{
              id: actionConfig.id,
              type: "normal",
              label: actionConfig.checked() ? actionConfig.checkedDisplayName : actionConfig.displayName,
              enabled: actionConfig.enabled(),
              visible: actionConfig.visible ? actionConfig.visible() : true,
            };
            actionMap[actionConfig.id] = () => {
              actionConfig.checked(!actionConfig.checked());
            };
            break;
          case "separator":
            menuItem = <IMenuItem>{
              type: "separator",
              visible: true,
            };
            break;
        }
        return menuItem;
      }),
      actionMap: actionMap,
    };

    return returnValue;
  };

  public open = () => {
    if (!!(<any>window).host) {
      var convertedMenuItem = ToolbarDropDown._convertToMenuItem(this.subgroup);

      (<any>window).host
        .executeProviderOperation("MenuManager.showMenu", {
          iFrameStack: [`#${window.frameElement.id}`],
          anchor: `#${this.id}`,
          menuItems: convertedMenuItem.menuItems,
        })
        .then((id?: string) => {
          if (!!id && !!convertedMenuItem.actionMap[id]) {
            convertedMenuItem.actionMap[id]();
          }
        });

      if (!!this._afterExecute) {
        this._afterExecute(this.id);
      }
    }
  };

  public mouseDown = (data: any, event: MouseEvent): boolean => {
    this.open();
    return false;
  };

  public keyUp = (data: any, event: KeyboardEvent): boolean => {
    var handled: boolean = false;

    handled = Utilities.onEnter(event, ($sourceElement: JQuery) => {
      this.open();
      if ($sourceElement.hasClass("active")) {
        $sourceElement.removeClass("active");
      }
      return true;
    });

    return !handled;
  };

  public keyDown = (data: any, event: KeyboardEvent): boolean => {
    var handled: boolean = false;

    handled = Utilities.onEnter(event, ($sourceElement: JQuery) => {
      if ($sourceElement.hasClass("active")) {
        $sourceElement.removeClass("active");
      }
      return true;
    });

    if (!handled) {
      // Reset color if [shift-] tabbing, 'up/down arrowing', or 'esc'-aping away from button while holding down 'enter'
      Utilities.onKeys(
        event,
        [KeyCodes.Tab, KeyCodes.UpArrow, KeyCodes.DownArrow, KeyCodes.Esc],
        ($sourceElement: JQuery) => {
          if ($sourceElement.hasClass("active")) {
            $sourceElement.removeClass("active");
          }
        }
      );
    }

    return !handled;
  };
}
