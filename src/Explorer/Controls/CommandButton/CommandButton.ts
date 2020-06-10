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
