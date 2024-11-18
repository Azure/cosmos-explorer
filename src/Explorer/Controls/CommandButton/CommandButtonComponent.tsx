/**
 * React component for Command button component.
 */
import Explorer from "Explorer/Explorer";
import { KeyboardAction } from "KeyboardShortcuts";
import * as React from "react";

/**
 * Options for this component
 */
export interface CommandButtonComponentProps {
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
  onCommandClick?: (e: React.SyntheticEvent | KeyboardEvent, container: Explorer) => void;

  /**
   * Label for the button
   */
  commandButtonLabel?: string;

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

  /**
   * If specified, a keyboard action that should trigger this button's onCommandClick handler when activated.
   * If not specified, the button will not be triggerable by keyboard shortcuts.
   */
  keyboardAction?: KeyboardAction;
}
