/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/

import KeyCodes from "./KeyCodes";

export default class Utilities {
  /**
   * Executes an action on a keyboard event.
   * Modifiers: ctrlKey - control/command key, shiftKey - shift key, altKey - alt/option key;
   * pass on 'null' to ignore the modifier (default).
   */
  public static onKey(
    event: any,
    eventKeyCode: number,
    action: ($sourceElement: JQuery) => void,
    metaKey: boolean = null,
    shiftKey: boolean = null,
    altKey: boolean = null
  ): boolean {
    var source: any = event.target || event.srcElement,
      keyCode: number = event.keyCode,
      $sourceElement = $(source),
      handled: boolean = false;

    if (
      $sourceElement.length &&
      keyCode === eventKeyCode &&
      $.isFunction(action) &&
      (metaKey === null || metaKey === event.metaKey) &&
      (shiftKey === null || shiftKey === event.shiftKey) &&
      (altKey === null || altKey === event.altKey)
    ) {
      action($sourceElement);
      handled = true;
    }

    return handled;
  }

  /**
   * Executes an action on the first matched keyboard event.
   */
  public static onKeys(
    event: any,
    eventKeyCodes: number[],
    action: ($sourceElement: JQuery) => void,
    metaKey: boolean = null,
    shiftKey: boolean = null,
    altKey: boolean = null
  ): boolean {
    var handled: boolean = false,
      keyCount: number,
      i: number;

    if ($.isArray(eventKeyCodes)) {
      keyCount = eventKeyCodes.length;

      for (i = 0; i < keyCount; ++i) {
        handled = Utilities.onKey(event, eventKeyCodes[i], action, metaKey, shiftKey, altKey);

        if (handled) {
          break;
        }
      }
    }

    return handled;
  }

  /**
   * Executes an action on an 'enter' keyboard event.
   */
  public static onEnter(
    event: any,
    action: ($sourceElement: JQuery) => void,
    metaKey: boolean = null,
    shiftKey: boolean = null,
    altKey: boolean = null
  ): boolean {
    return Utilities.onKey(event, KeyCodes.Enter, action, metaKey, shiftKey, altKey);
  }

  /**
   * Executes an action on a 'tab' keyboard event.
   */
  public static onTab(
    event: any,
    action: ($sourceElement: JQuery) => void,
    metaKey: boolean = null,
    shiftKey: boolean = null,
    altKey: boolean = null
  ): boolean {
    return Utilities.onKey(event, KeyCodes.Tab, action, metaKey, shiftKey, altKey);
  }

  /**
   * Executes an action on an 'Esc' keyboard event.
   */
  public static onEsc(
    event: any,
    action: ($sourceElement: JQuery) => void,
    metaKey: boolean = null,
    shiftKey: boolean = null,
    altKey: boolean = null
  ): boolean {
    return Utilities.onKey(event, KeyCodes.Esc, action, metaKey, shiftKey, altKey);
  }

  /**
   * Executes an action on an 'UpArrow' keyboard event.
   */
  public static onUpArrow(
    event: any,
    action: ($sourceElement: JQuery) => void,
    metaKey: boolean = null,
    shiftKey: boolean = null,
    altKey: boolean = null
  ): boolean {
    return Utilities.onKey(event, KeyCodes.UpArrow, action, metaKey, shiftKey, altKey);
  }

  /**
   * Executes an action on a 'DownArrow' keyboard event.
   */
  public static onDownArrow(
    event: any,
    action: ($sourceElement: JQuery) => void,
    metaKey: boolean = null,
    shiftKey: boolean = null,
    altKey: boolean = null
  ): boolean {
    return Utilities.onKey(event, KeyCodes.DownArrow, action, metaKey, shiftKey, altKey);
  }

  /**
   * Executes an action on a mouse event.
   */
  public static onButton(event: any, eventButtonCode: number, action: ($sourceElement: JQuery) => void): boolean {
    var source: any = event.currentTarget;
    var buttonCode: number = event.button;
    var $sourceElement = $(source);
    var handled: boolean = false;

    if ($sourceElement.length && buttonCode === eventButtonCode && $.isFunction(action)) {
      action($sourceElement);
      handled = true;
    }

    return handled;
  }

  /**
   * Executes an action on a 'left' mouse event.
   */
  public static onLeftButton(event: any, action: ($sourceElement: JQuery) => void): boolean {
    return Utilities.onButton(event, buttonCodes.Left, action);
  }
}

var buttonCodes = {
  None: -1,
  Left: 0,
  Middle: 1,
  Right: 2
};
