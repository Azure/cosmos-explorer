import {
  ChoiceGroup,
  DefaultButton,
  DialogFooter,
  DialogType,
  Dialog as FluentDialog,
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
import React, { FC, useEffect } from "react";
import create, { UseStore } from "zustand";

export interface DialogState {
  visible: boolean;
  dialogProps?: DialogProps;
  openDialog: (props: DialogProps) => void;
  closeDialog: () => void;
  showOkCancelModalDialog: (
    title: string,
    subText: string,
    okLabel: string,
    onOk: () => void,
    cancelLabel: string,
    onCancel: () => void,
    contentHtml?: JSX.Element,
    choiceGroupProps?: IChoiceGroupProps,
    textFieldProps?: TextFieldProps,
    primaryButtonDisabled?: boolean,
  ) => void;
  showOkModalDialog: (title: string, subText: string, linkProps?: LinkProps) => void;
}

export const useDialog: UseStore<DialogState> = create((set, get) => ({
  visible: false,
  openDialog: (props: DialogProps) => set(() => ({ visible: true, dialogProps: props })),
  closeDialog: () =>
    set(
      (state) => ({
        visible: false,
        openDialog: state.openDialog,
        closeDialog: state.closeDialog,
        showOkCancelModalDialog: state.showOkCancelModalDialog,
        showOkModalDialog: state.showOkModalDialog,
      }),
      true, // TODO: This probably should not be true but its causing a prod bug so easier to just set the proper state above
    ),
  showOkCancelModalDialog: (
    title: string,
    subText: string,
    okLabel: string,
    onOk: () => void,
    cancelLabel: string,
    onCancel: () => void,
    contentHtml?: JSX.Element,
    choiceGroupProps?: IChoiceGroupProps,
    textFieldProps?: TextFieldProps,
    primaryButtonDisabled?: boolean,
  ): void =>
    get().openDialog({
      isModal: true,
      title,
      subText,
      primaryButtonText: okLabel,
      secondaryButtonText: cancelLabel,
      onPrimaryButtonClick: () => {
        get().closeDialog();
        onOk && onOk();
      },
      onSecondaryButtonClick: () => {
        get().closeDialog();
        onCancel && onCancel();
      },
      contentHtml,
      choiceGroupProps,
      textFieldProps,
      primaryButtonDisabled,
    }),
  showOkModalDialog: (title: string, subText: string, linkProps?: LinkProps): void =>
    get().openDialog({
      isModal: true,
      title,
      subText,
      primaryButtonText: "Close",
      secondaryButtonText: undefined,
      onPrimaryButtonClick: () => {
        get().closeDialog();
      },
      onSecondaryButtonClick: undefined,
      linkProps,
    }),
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
  contentHtml?: JSX.Element;
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
    contentHtml,
  } = props || {};

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      useDialog.getState().closeDialog();
    }
  };

  useEffect(() => {
    if (visible) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }
  }, [visible]);

  const dialogProps: IDialogProps = {
    hidden: !visible,
    dialogContentProps: {
      type: type || DialogType.normal,
      title,
      subText,
      styles: {
        title: {
          fontSize: DIALOG_TITLE_FONT_SIZE,
          fontWeight: DIALOG_TITLE_FONT_WEIGHT,
        },
        subText: {
          fontSize: DIALOG_SUBTEXT_FONT_SIZE,
          color: "var(--colorNeutralForeground2)",
        },
        content: {
          backgroundColor: "var(--colorNeutralBackground1)",
          color: "var(--colorNeutralForeground1)",
        },
      },
      showCloseButton: showCloseButton || false,
      onDismiss,
    },
    modalProps: { isBlocking: isModal, isDarkOverlay: false },
    minWidth: DIALOG_MIN_WIDTH,
    maxWidth: DIALOG_MAX_WIDTH,
    styles: {
      main: {
        backgroundColor: "var(--colorNeutralBackground1)",
        selectors: {
          ".ms-Dialog-title": { color: "var(--colorNeutralForeground1)" },
        },
      },
    },
  };

  const primaryButtonProps: IButtonProps = {
    text: primaryButtonText,
    disabled: primaryButtonDisabled || false,
    onClick: onPrimaryButtonClick,
    styles: {
      root: {
        backgroundColor: "var(--colorBrandBackground)",
        color: "var(--colorNeutralForegroundOnBrand)",
        selectors: {
          ":hover": {
            backgroundColor: "var(--colorBrandBackgroundHover)",
            color: "var(--colorNeutralForegroundOnBrand)",
          },
          ":active": {
            backgroundColor: "var(--colorBrandBackgroundPressed)",
            color: "var(--colorNeutralForegroundOnBrand)",
          },
        },
      },
    },
  };
  const secondaryButtonProps: IButtonProps =
    secondaryButtonText && onSecondaryButtonClick
      ? {
          text: secondaryButtonText,
          onClick: onSecondaryButtonClick,
          styles: {
            root: {
              backgroundColor: "var(--colorNeutralBackground2)",
              color: "var(--colorNeutralForeground1)",
              borderColor: "var(--colorNeutralStroke1)",
              selectors: {
                ":hover": {
                  backgroundColor: "var(--colorNeutralBackground3)",
                  color: "var(--colorNeutralForeground1)",
                },
                ":active": {
                  backgroundColor: "var(--colorNeutralBackground3)",
                  color: "var(--colorNeutralForeground1)",
                  borderColor: "var(--colorCompoundBrandStroke1)",
                },
              },
            },
          },
        }
      : undefined;
  return visible ? (
    <FluentDialog {...dialogProps}>
      {choiceGroupProps && <ChoiceGroup {...choiceGroupProps} />}
      {textFieldProps && <TextField {...textFieldProps} />}
      {linkProps && (
        <Link href={linkProps.linkUrl} target="_blank">
          {linkProps.linkText} <FontIcon iconName="NavigateExternalInline" />
        </Link>
      )}
      {contentHtml}
      {progressIndicatorProps && <ProgressIndicator {...progressIndicatorProps} />}
      <DialogFooter>
        <PrimaryButton {...primaryButtonProps} data-test={`DialogButton:${primaryButtonText}`} />
        {secondaryButtonProps && (
          <DefaultButton {...secondaryButtonProps} data-test={`DialogButton:${secondaryButtonText}`} />
        )}
      </DialogFooter>
    </FluentDialog>
  ) : (
    <></>
  );
};
