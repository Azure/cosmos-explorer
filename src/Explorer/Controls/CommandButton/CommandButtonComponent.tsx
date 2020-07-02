import { StringUtils } from "../../../Utils/StringUtils";
import { KeyCodes } from "../../../Common/Constants";
import TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import CollapseChevronDownIcon from "../../../../images/QueryBuilder/CollapseChevronDown_16x.png";

/**
 * React component for Command button component.
 */

import * as React from "react";
import { ArcadiaMenuPickerProps } from "../Arcadia/ArcadiaMenuPicker";

/**
 * Options for this component
 */
export interface CommandButtonComponentProps {
  /**
   * font icon name for the button
   */
  iconName?: string;

  /**
   * image source for the button icon
   */
  iconSrc?: string;

  /**
   * image alt for accessibility
   */
  iconAlt?: string;

  /**
   * Click handler for command button click
   */
  onCommandClick: (e: React.SyntheticEvent) => void;

  /**
   * Label for the button
   */
  commandButtonLabel: string;

  /**
   * True if this button opens a tab or pane, false otherwise.
   */
  hasPopup: boolean;

  /**
   * Enabled/disabled state of command button
   */
  disabled?: boolean;

  /**
   * Whether or not the button should have the 'selectedButton' styling
   */
  isSelected?: boolean;

  /**
   * Text to displayed in the tooltip on hover
   */
  tooltipText?: string;

  /**
   * tabindex for the command button
   */
  tabIndex?: number;

  /**
   * Childrens command buttons to hide in the dropdown
   */
  children?: CommandButtonComponentProps[];

  /**
   * Optional id
   */
  id?: string;

  /**
   * Optional class name
   */
  className?: string;

  /**
   * If true, display as dropdown
   */
  isDropdown?: boolean;

  /**
   * Placeholder if dropdown
   */
  dropdownPlaceholder?: string;

  /**
   * Dropdown selection
   */
  dropdownSelectedKey?: string;

  /**
   * This is the key of the dropdown item
   * The text is commandLabel
   */
  dropdownItemKey?: string;

  /**
   * Possible width
   */
  dropdownWidth?: number;

  /**
   * Vertical bar to divide buttons
   */
  isDivider?: boolean;
  /**
   * Aria-label for the button
   */
  ariaLabel: string;
  //TODO: generalize customized command bar
  /**
   * If set to true, will render arcadia picker
   */
  isArcadiaPicker?: boolean;
  /**
   * props to render arcadia picker
   */
  arcadiaProps?: ArcadiaMenuPickerProps;
}

export class CommandButtonComponent extends React.Component<CommandButtonComponentProps> {
  private dropdownElt: HTMLElement;
  private expandButtonElt: HTMLElement;

  public componentDidUpdate(): void {
    if (!this.dropdownElt || !this.expandButtonElt) {
      return;
    }

    const dropdownElt = $(this.dropdownElt).offset({ left: $(this.expandButtonElt).offset().left });
  }

  private onKeyPress(event: React.KeyboardEvent): boolean {
    if (event.keyCode === KeyCodes.Space || event.keyCode === KeyCodes.Enter) {
      this.commandClickCallback && this.commandClickCallback(event);
      event.stopPropagation();
      return false;
    }
    return true;
  }

  private onLauncherKeyDown(event: React.KeyboardEvent<HTMLDivElement>): boolean {
    if (event.keyCode === KeyCodes.DownArrow) {
      $(this.dropdownElt).hide();
      $(this.dropdownElt).show().focus();
      event.stopPropagation();
      return false;
    }
    if (event.keyCode === KeyCodes.UpArrow) {
      $(this.dropdownElt).hide();
      event.stopPropagation();
      return false;
    }
    return true;
  }

  private getCommandButtonId(): string {
    if (this.props.id) {
      return this.props.id;
    } else {
      return `commandButton-${StringUtils.stripSpacesFromString(this.props.commandButtonLabel)}`;
    }
  }

  public static renderButton(options: CommandButtonComponentProps, key?: string): JSX.Element {
    return <CommandButtonComponent key={key} {...options} />;
  }

  private commandClickCallback(e: React.SyntheticEvent): void {
    if (this.props.disabled) {
      return;
    }

    // TODO Query component's parent, not document
    const el = document.querySelector(".commandDropdownContainer") as HTMLElement;
    if (el) {
      el.style.display = "none";
    }
    this.props.onCommandClick(e);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      commandButtonClicked: this.props.commandButtonLabel,
    });
  }

  private renderChildren(): JSX.Element {
    if (!this.props.children || this.props.children.length < 1) {
      return <React.Fragment />;
    }

    return (
      <div
        className="commandExpand"
        tabIndex={0}
        ref={(ref: HTMLElement) => {
          this.expandButtonElt = ref;
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => this.onLauncherKeyDown(e)}
      >
        <div className="commandDropdownLauncher">
          <span className="partialSplitter" />
          <span className="expandDropdown">
            <img src={CollapseChevronDownIcon} />
          </span>
        </div>
        <div
          className="commandDropdownContainer"
          ref={(ref: HTMLElement) => {
            this.dropdownElt = ref;
          }}
        >
          <div className="commandDropdown">
            {this.props.children.map(
              (c: CommandButtonComponentProps, index: number): JSX.Element => {
                return CommandButtonComponent.renderButton(c, `${index}`);
              }
            )}
          </div>
        </div>
      </div>
    );
  }

  public static renderLabel(
    props: CommandButtonComponentProps,
    key?: string,
    refct?: (input: HTMLElement) => void
  ): JSX.Element {
    if (!props.commandButtonLabel) {
      return <React.Fragment />;
    }

    return (
      <span className="commandLabel" key={key} ref={refct}>
        {props.commandButtonLabel}
      </span>
    );
  }

  public render(): JSX.Element {
    let mainClassName = "commandButtonComponent";
    if (this.props.disabled) {
      mainClassName += " commandDisabled";
    }
    if (this.props.isSelected) {
      mainClassName += " selectedButton";
    }

    let contentClassName = "commandContent";
    if (this.props.children && this.props.children.length > 0) {
      contentClassName += " hasHiddenItems";
    }

    return (
      <div className="commandButtonReact">
        <span
          className={mainClassName}
          role="menuitem"
          tabIndex={this.props.tabIndex}
          onKeyPress={(e: React.KeyboardEvent<HTMLSpanElement>) => this.onKeyPress(e)}
          title={this.props.tooltipText}
          id={this.getCommandButtonId()}
          aria-disabled={this.props.disabled}
          aria-haspopup={this.props.hasPopup}
          aria-label={this.props.ariaLabel}
          onClick={(e: React.MouseEvent<HTMLSpanElement>) => this.commandClickCallback(e)}
        >
          <div className={contentClassName}>
            <img className="commandIcon" src={this.props.iconSrc} alt={this.props.iconAlt} />
            {CommandButtonComponent.renderLabel(this.props)}
          </div>
        </span>
        {this.props.children && this.renderChildren()}
      </div>
    );
  }
}
