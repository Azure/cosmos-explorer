/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/

import * as ko from "knockout";
import { IAction } from "./IToolbarDropDown";
import IToolbarAction from "./IToolbarAction";
import KeyCodes from "./KeyCodes";
import Utilities from "./Utilities";

export default class ToolbarAction implements IToolbarAction {
  public type: "action" = "action";
  public id: string;
  public icon: string;
  public title: ko.Observable<string>;
  public displayName: ko.Observable<string>;
  public enabled: ko.Subscribable<boolean>;
  public visible: ko.Observable<boolean>;
  public focused: ko.Observable<boolean>;
  public action: () => void;
  private _afterExecute: (id: string) => void;

  constructor(actionItem: IAction, afterExecute?: (id: string) => void) {
    this.action = actionItem.action;
    this.title = ko.observable(actionItem.title);
    this.displayName = ko.observable(actionItem.displayName);
    this.id = actionItem.id;
    this.enabled = actionItem.enabled;
    this.visible = actionItem.visible ? actionItem.visible : ko.observable(true);
    this.focused = ko.observable(false);
    this.icon = actionItem.icon;
    this._afterExecute = afterExecute;
  }

  private _executeAction = () => {
    this.action();
    if (!!this._afterExecute) {
      this._afterExecute(this.id);
    }
  };

  public mouseDown = (data: any, event: MouseEvent): boolean => {
    this._executeAction();
    return false;
  };

  public keyUp = (data: any, event: KeyboardEvent): boolean => {
    var handled: boolean = false;

    handled = Utilities.onEnter(event, ($sourceElement: JQuery) => {
      this._executeAction();
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
