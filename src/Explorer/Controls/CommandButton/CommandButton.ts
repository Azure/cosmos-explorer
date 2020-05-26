/**
 * How to use this component:
 *
 * In your html markup, use:
 * <command-button params="{
 *                             iconSrc: '/icon/example/src/',
 *                             onCommandClick: () => { doSomething },
 *                             commandButtonLabel: 'Some Label'
 *                             disabled: true/false
 *                         }">
 * </command-button>
 *
 */

import * as ko from "knockout";
import * as ViewModels from "../../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import { WaitsForTemplateViewModel } from "../../WaitsForTemplateViewModel";
import { KeyCodes } from "../../../Common/Constants";

import TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import template from "./command-button.html";

/**
 * Options for this component
 */
export interface CommandButtonOptions {
  /**
   * image source for the button icon
   */
  iconSrc: string;

  /**
   * Id for the button icon
   */
  id: string;

  /**
   * Click handler for command button click
   */
  onCommandClick: () => void;

  /**
   * Label for the button
   */
  commandButtonLabel: string | ko.Observable<string>;

  /**
   * True if this button opens a tab or pane, false otherwise.
   */
  hasPopup: boolean;

  /**
   * Enabled/disabled state of command button
   */
  disabled?: ko.Subscribable<boolean>;

  /**
   * Visibility/Invisibility of the button
   */
  visible?: ko.Subscribable<boolean>;

  /**
   * Whether or not the button should have the 'selectedButton' styling
   */
  isSelected?: ko.Observable<boolean>;

  /**
   * Text to displayed in the tooltip on hover
   */
  tooltipText?: string | ko.Observable<string>;

  /**
   * Callback triggered when the template is bound to the component
   */
  onTemplateReady?: () => void;

  /**
   * tabindex for the command button
   */
  tabIndex?: ko.Observable<number>;

  /**
   * Childrens command buttons to hide in the dropdown
   */
  children?: CommandButtonOptions[];
}

export class CommandButtonViewModel extends WaitsForTemplateViewModel implements ViewModels.CommandButton {
  public commandClickCallback: () => void;
  public commandButtonId: string;
  public disabled: ko.Subscribable<boolean>;
  public visible: ko.Subscribable<boolean>;
  public isSelected: ko.Observable<boolean>;
  public iconSrc: string;
  public commandButtonLabel: ko.Observable<string>;
  public tooltipText: ko.Observable<string>;
  public tabIndex: ko.Observable<number>;
  public isTemplateReady: ko.Observable<boolean>;
  public hasPopup: boolean;
  public children: ko.ObservableArray<CommandButtonOptions>;

  public constructor(options: { buttonProps: CommandButtonOptions }) {
    super();
    const props = options.buttonProps;
    const commandButtonLabel = props.commandButtonLabel;
    const tooltipText = props.tooltipText;
    this.commandButtonLabel =
      typeof commandButtonLabel === "string" ? ko.observable<string>(commandButtonLabel) : commandButtonLabel;
    this.commandButtonId = props.id;
    this.disabled = props.disabled || ko.observable(false);
    this.visible = props.visible || ko.observable(true);
    this.isSelected = props.isSelected || ko.observable(false);
    this.iconSrc = props.iconSrc;
    this.tabIndex = props.tabIndex || ko.observable(0);
    this.hasPopup = props.hasPopup;
    this.children = ko.observableArray(props.children);

    super.onTemplateReady((isTemplateReady: boolean) => {
      if (isTemplateReady && props.onTemplateReady) {
        props.onTemplateReady();
      }
    });

    if (tooltipText && typeof tooltipText === "string") {
      this.tooltipText = ko.observable<string>(tooltipText);
    } else if (tooltipText && typeof tooltipText === "function") {
      this.tooltipText = tooltipText;
    } else {
      this.tooltipText = this.commandButtonLabel;
    }

    this.commandClickCallback = () => {
      if (this.disabled()) {
        return;
      }

      const el = document.querySelector(".commandDropdownContainer") as HTMLElement;
      if (el) {
        el.style.display = "none";
      }
      props.onCommandClick();
      TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
        commandButtonClicked: this.commandButtonLabel
      });
    };
  }

  public onKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === KeyCodes.Space || event.keyCode === KeyCodes.Enter) {
      this.commandClickCallback && this.commandClickCallback();
      event.stopPropagation();
      return false;
    }
    return true;
  }

  public onLauncherKeyDown(source: any, event: KeyboardEvent): boolean {
    // TODO: Convert JQuery code into Knockout
    if (event.keyCode === KeyCodes.DownArrow) {
      $(event.target)
        .parent()
        .siblings()
        .children(".commandExpand")
        .children(".commandDropdownContainer")
        .hide();
      $(event.target)
        .children(".commandDropdownContainer")
        .show()
        .focus();
      event.stopPropagation();
      return false;
    }
    if (event.keyCode === KeyCodes.UpArrow) {
      $(event.target)
        .children(".commandDropdownContainer")
        .hide();
      event.stopPropagation();
      return false;
    }
    return true;
  }
}

/**
 * Helper class for ko component registration
 */
export const CommandButtonComponent = {
  viewModel: CommandButtonViewModel,
  template
};
