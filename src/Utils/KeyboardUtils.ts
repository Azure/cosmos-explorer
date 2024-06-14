/**
 * Is the environment 'ctrl' key press. This key is used for multi selection, like select one more item, select all.
 * For Windows and Linux, it's ctrl. For Mac, it's command.
 */
export const isEnvironmentCtrlPressed = (event: JQueryEventObject | React.MouseEvent): boolean =>
  isMac() ? event.metaKey : event.ctrlKey;

export const isEnvironmentShiftPressed = (event: JQueryEventObject | React.MouseEvent): boolean => event.shiftKey;

export const isEnvironmentAltPressed = (event: JQueryEventObject | React.MouseEvent): boolean => event.altKey;

/**
 * Returns whether the current platform is MacOS.
 */
export const isMac = (): boolean => navigator.platform.toUpperCase().indexOf("MAC") >= 0;
