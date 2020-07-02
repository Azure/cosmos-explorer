/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/
import { IDropdown } from "./IToolbarDropDown";
import { IActionConfigItem } from "./IToolbarDropDown";
import IToolbarItem from "./IToolbarItem";

import * as ko from "knockout";
import ToolbarDropDown from "./ToolbarDropDown";
import ToolbarAction from "./ToolbarAction";
import ToolbarToggle from "./ToolbarToggle";
import template from "./toolbar.html";

export default class Toolbar {
  private _toolbarWidth = ko.observable<number>();
  private _actionConfigs: IActionConfigItem[];
  private _afterExecute: (id: string) => void;

  private _hasFocus: boolean = false;
  private _focusedSubscription: ko.Subscription;

  constructor(actionItems: IActionConfigItem[], afterExecute?: (id: string) => void) {
    this._actionConfigs = actionItems;
    this._afterExecute = afterExecute;
    this.toolbarItems.subscribe(this._focusFirstEnabledItem);

    $(window).resize(() => {
      this._toolbarWidth($(".toolbar").width());
    });
    setTimeout(() => {
      this._toolbarWidth($(".toolbar").width());
    }, 500);
  }

  public toolbarItems: ko.PureComputed<IToolbarItem[]> = ko.pureComputed(() => {
    var remainingToolbarSpace = this._toolbarWidth();
    var toolbarItems: IToolbarItem[] = [];

    var moreItem: IDropdown = {
      type: "dropdown",
      title: "More",
      displayName: "More",
      id: "more-actions-toggle",
      enabled: ko.observable(true),
      visible: ko.observable(true),
      icon: "images/ASX_More.svg",
      subgroup: [],
    };

    var showHasMoreItem = false;
    var addSeparator = false;
    this._actionConfigs.forEach((actionConfig) => {
      if (actionConfig.type === "separator") {
        addSeparator = true;
      } else if (remainingToolbarSpace / 60 > 2) {
        if (addSeparator) {
          addSeparator = false;
          toolbarItems.push(Toolbar._createToolbarItemFromConfig({ type: "separator" }));
          remainingToolbarSpace -= 10;
        }

        toolbarItems.push(Toolbar._createToolbarItemFromConfig(actionConfig));
        remainingToolbarSpace -= 60;
      } else {
        showHasMoreItem = true;
        if (addSeparator) {
          addSeparator = false;
          moreItem.subgroup.push({
            type: "separator",
          });
        }

        if (!!actionConfig) {
          moreItem.subgroup.push(actionConfig);
        }
      }
    });

    if (showHasMoreItem) {
      toolbarItems.push(
        Toolbar._createToolbarItemFromConfig({ type: "separator" }),
        Toolbar._createToolbarItemFromConfig(moreItem)
      );
    }

    return toolbarItems;
  });

  public focus() {
    this._hasFocus = true;
    this._focusFirstEnabledItem(this.toolbarItems());
  }

  private _focusFirstEnabledItem = (items: IToolbarItem[]) => {
    if (!!this._focusedSubscription) {
      // no memory leaks! :D
      this._focusedSubscription.dispose();
    }
    if (this._hasFocus) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].type !== "separator" && (<any>items[i]).enabled()) {
          (<any>items[i]).focused(true);
          this._focusedSubscription = (<any>items[i]).focused.subscribe((newValue: any) => {
            if (!newValue) {
              this._hasFocus = false;
              this._focusedSubscription.dispose();
            }
          });
          break;
        }
      }
    }
  };

  private static _createToolbarItemFromConfig(
    configItem: IActionConfigItem,
    afterExecute?: (id: string) => void
  ): IToolbarItem {
    switch (configItem.type) {
      case "dropdown":
        return new ToolbarDropDown(configItem, afterExecute);
      case "action":
        return new ToolbarAction(configItem, afterExecute);
      case "toggle":
        return new ToolbarToggle(configItem, afterExecute);
      case "separator":
        return {
          type: "separator",
          visible: ko.observable(true),
        };
    }
  }
}

/**
 * Helper class for ko component registration
 */
export class ToolbarComponent {
  constructor() {
    return {
      viewModel: Toolbar,
      template,
    };
  }
}
