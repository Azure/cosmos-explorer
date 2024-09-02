import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Field,
  ProgressBar,
} from "@fluentui/react-components";
import * as React from "react";

interface ProgressModalDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  maxValue: number;
  value: number;
  dismissText: string;
  onDismiss: () => void;
  onCancel?: () => void;
  /* mode drives the state of the action buttons
   * inProgress: Show cancel button
   * completed: Show close button
   * aborting: Show cancel button, but disabled
   * aborted: Show close button
   */
  mode?: "inProgress" | "completed" | "aborting" | "aborted";
}

/**
 * React component that renders a modal dialog with a progress bar.
 */
export const ProgressModalDialog: React.FC<ProgressModalDialogProps> = ({
  isOpen,
  title,
  message,
  maxValue,
  value,
  dismissText,
  onCancel,
  onDismiss,
  children,
  mode = "completed",
}) => (
  <Dialog
    open={isOpen}
    onOpenChange={(event, data) => {
      if (!data.open) {
        onDismiss();
      }
    }}
  >
    <DialogSurface>
      <DialogBody>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Field validationMessage={message} validationState="none">
            <ProgressBar max={maxValue} value={value} />
          </Field>
          {children}
        </DialogContent>
        <DialogActions>
          {mode === "inProgress" || mode === "aborting" ? (
            <Button appearance="secondary" onClick={onCancel} disabled={mode === "aborting"}>
              {dismissText}
            </Button>
          ) : (
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary">Close</Button>
            </DialogTrigger>
          )}
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  </Dialog>
);
