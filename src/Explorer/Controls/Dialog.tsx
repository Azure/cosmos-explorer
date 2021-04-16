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
import * as React from "react";

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
  visible: boolean;
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

export class Dialog extends React.Component<DialogProps> {
  constructor(props: DialogProps) {
    super(props);
  }

  public render(): JSX.Element {
    const dialogProps: IDialogProps = {
      hidden: !this.props.visible,
      dialogContentProps: {
        type: this.props.type || DialogType.normal,
        title: this.props.title,
        subText: this.props.subText,
        styles: {
          title: { fontSize: DIALOG_TITLE_FONT_SIZE, fontWeight: DIALOG_TITLE_FONT_WEIGHT },
          subText: { fontSize: DIALOG_SUBTEXT_FONT_SIZE },
        },
        showCloseButton: this.props.showCloseButton || false,
        onDismiss: this.props.onDismiss,
      },
      modalProps: { isBlocking: this.props.isModal, isDarkOverlay: false },
      minWidth: DIALOG_MIN_WIDTH,
      maxWidth: DIALOG_MAX_WIDTH,
    };
    const choiceGroupProps: IChoiceGroupProps = this.props.choiceGroupProps;
    const textFieldProps: ITextFieldProps = this.props.textFieldProps;
    const linkProps: LinkProps = this.props.linkProps;
    const progressIndicatorProps: IProgressIndicatorProps = this.props.progressIndicatorProps;
    const primaryButtonProps: IButtonProps = {
      text: this.props.primaryButtonText,
      disabled: this.props.primaryButtonDisabled || false,
      onClick: this.props.onPrimaryButtonClick,
    };
    const secondaryButtonProps: IButtonProps =
      this.props.secondaryButtonText && this.props.onSecondaryButtonClick
        ? {
            text: this.props.secondaryButtonText,
            onClick: this.props.onSecondaryButtonClick,
          }
        : undefined;

    return (
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
    );
  }
}
