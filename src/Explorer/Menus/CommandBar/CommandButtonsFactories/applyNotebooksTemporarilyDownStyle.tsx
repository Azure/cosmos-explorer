import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";

export function applyNotebooksTemporarilyDownStyle(buttonProps: CommandButtonComponentProps, tooltip: string): void {
  if (!buttonProps.isDivider) {
    buttonProps.disabled = true;
    buttonProps.tooltipText = tooltip;
  }
}
