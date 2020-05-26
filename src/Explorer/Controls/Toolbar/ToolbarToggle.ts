/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/

import * as ko from "knockout";
import { IToggle } from "./IToolbarDropDown";
import IToolbarToggle from "./IToolbarToggle";
import KeyCodes from "./KeyCodes";
import Utilities from "./Utilities";

export default class ToolbarToggle implements IToolbarToggle {
  public type: "toggle" = "toggle";
  public checked: ko.Observable<boolean>;
  public id: string;
  public enabled: ko.Observable<boolean>;
  public visible: ko.Observable<boolean>;
  public focused: ko.Observable<boolean>;
  public icon: string;

  private _title: string;
  private _displayName: string;
  private _checkedTitle: string;
  private _checkedDisplayName: string;

  private _afterExecute: (id: string) => void;

  constructor(toggleItem: IToggle, afterExecute?: (id: string) => void) {
    this._title = toggleItem.title;
    this._displayName = toggleItem.displayName;
    this.id = toggleItem.id;
    this.enabled = toggleItem.enabled;
    this.visible = toggleItem.visible ? toggleItem.visible : ko.observable(true);
    this.focused = ko.observable(false);
    this.icon = toggleItem.icon;
    this.checked = toggleItem.checked;
    this._checkedTitle = toggleItem.checkedTitle;
    this._checkedDisplayName = toggleItem.checkedDisplayName;
    this._afterExecute = afterExecute;
  }

  public title = ko.pureComputed(() => {
    if (this.checked()) {
      return this._checkedTitle;
    } else {
      return this._title;
    }
  });

  public displayName = ko.pureComputed(() => {
    if (this.checked()) {
      return this._checkedDisplayName;
    } else {
      return this._displayName;
    }
  });

  public toggle = () => {
    this.checked(!this.checked());

    if (this.checked() && !!this._afterExecute) {
      this._afterExecute(this.id);
    }
  };

  public mouseDown = (data: any, event: MouseEvent): boolean => {
    this.toggle();
    return false;
  };

  public keyUp = (data: any, event: KeyboardEvent): boolean => {
    var handled: boolean = false;

    handled = Utilities.onEnter(event, ($sourceElement: JQuery) => {
      this.toggle();
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
