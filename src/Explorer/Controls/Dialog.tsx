import {
  ChoiceGroup,
  DefaultButton,
  Dialog as FluentDialog,
  DialogFooter,
  DialogType,
  FontIcon,
  IButtonProps,
  IChoiceGroupProps,
  IDialogProps,
  IProgressIndicatorProps,
  ITextFieldProps,
  Link,
  PrimaryButton,
  ProgressIndicator,
  TextField,
} from "@fluentui/react";
import React, { FC } from "react";
import create, { UseStore } from "zustand";

export interface DialogState {
  visible: boolean;
  dialogProps?: DialogProps;
  openDialog: (props: DialogProps) => void;
  closeDialog: () => void;
}

export const useDialog: UseStore<DialogState> = create((set) => ({
  visible: false,
  openDialog: (props: DialogProps) => set(() => ({ visible: true, dialogProps: props })),
  closeDialog: () =>
    set((state) => ({ visible: false, openDialog: state.openDialog, closeDialog: state.closeDialog }), true),
}));

export interface TextFieldProps extends ITextFieldProps {
  label: string;
  multiline: boolean;
  autoAdjustHeight: boolean;
  rows: number;
  onChange: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => void;
  defaultValue?: string;
}

export interface LinkProps {
  linkText: string;
  linkUrl: string;
}

export interface DialogProps {
  title: string;
  subText: string;
  isModal: boolean;
  choiceGroupProps?: IChoiceGroupProps;
  textFieldProps?: TextFieldProps;
  linkProps?: LinkProps;
  progressIndicatorProps?: IProgressIndicatorProps;
  primaryButtonText: string;
  secondaryButtonText: string;
  onPrimaryButtonClick: () => void;
  onSecondaryButtonClick: () => void;
  primaryButtonDisabled?: boolean;
  type?: DialogType;
  showCloseButton?: boolean;
  onDismiss?: () => void;
}

const DIALOG_MIN_WIDTH = "400px";
const DIALOG_MAX_WIDTH = "600px";
const DIALOG_TITLE_FONT_SIZE = "17px";
const DIALOG_TITLE_FONT_WEIGHT = 400;
const DIALOG_SUBTEXT_FONT_SIZE = "15px";

export const Dialog: FC = () => {
  const { visible, dialogProps: props } = useDialog();
  const {
    title,
    subText,
    isModal,
    choiceGroupProps,
    textFieldProps,
    linkProps,
    progressIndicatorProps,
    primaryButtonText,
    secondaryButtonText,
    onPrimaryButtonClick,
    onSecondaryButtonClick,
    primaryButtonDisabled,
    type,
    showCloseButton,
    onDismiss,
  } = props || {};

  const dialogProps: IDialogProps = {
    hidden: !visible,
    dialogContentProps: {
      type: type || DialogType.normal,
      title,
      subText,
      styles: {
        title: { fontSize: DIALOG_TITLE_FONT_SIZE, fontWeight: DIALOG_TITLE_FONT_WEIGHT },
        subText: { fontSize: DIALOG_SUBTEXT_FONT_SIZE },
      },
      showCloseButton: showCloseButton || false,
      onDismiss,
    },
    modalProps: { isBlocking: isModal, isDarkOverlay: false },
    minWidth: DIALOG_MIN_WIDTH,
    maxWidth: DIALOG_MAX_WIDTH,
  };

  const primaryButtonProps: IButtonProps = {
    text: primaryButtonText,
    disabled: primaryButtonDisabled || false,
    onClick: onPrimaryButtonClick,
  };
  const secondaryButtonProps: IButtonProps =
    secondaryButtonText && onSecondaryButtonClick
      ? {
          text: secondaryButtonText,
          onClick: onSecondaryButtonClick,
        }
      : {};

  return visible ? (
    <FluentDialog {...dialogProps}>
      {choiceGroupProps && <ChoiceGroup {...choiceGroupProps} />}
      {textFieldProps && <TextField {...textFieldProps} />}
      {linkProps && (
        <Link href={linkProps.linkUrl} target="_blank">
          {linkProps.linkText} <FontIcon iconName="NavigateExternalInline" />
        </Link>
      )}
      {progressIndicatorProps && <ProgressIndicator {...progressIndicatorProps} />}
      <DialogFooter>
        <PrimaryButton {...primaryButtonProps} />
        {secondaryButtonProps && <DefaultButton {...secondaryButtonProps} />}
      </DialogFooter>
    </FluentDialog>
  ) : (
    <></>
  );
};
