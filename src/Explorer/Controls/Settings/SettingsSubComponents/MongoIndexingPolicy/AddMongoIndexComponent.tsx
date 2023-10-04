import * as React from "react";
import {
  MessageBar,
  MessageBarType,
  Stack,
  IconButton,
  TextField,
  Dropdown,
  IDropdownOption,
  ITextField,
} from "@fluentui/react";
import {
  addMongoIndexSubElementsTokens,
  mongoErrorMessageStyles,
  mongoWarningStackProps,
  shortWidthDropDownStyles,
  shortWidthTextFieldStyles,
} from "../../SettingsRenderUtils";
import {
  getMongoIndexTypeText,
  MongoIndexTypes,
  MongoNotificationMessage,
  MongoNotificationType,
  MongoWildcardPlaceHolder,
} from "../../SettingsUtils";

export interface AddMongoIndexComponentProps {
  position: number;
  description: string;
  type: MongoIndexTypes;
  notification: MongoNotificationMessage;
  onIndexAddOrChange: (description: string, type: MongoIndexTypes) => void;
  onDiscard: () => void;
  disabled?: boolean;
}

export class AddMongoIndexComponent extends React.Component<AddMongoIndexComponentProps> {
  private descriptionTextField: ITextField;
  private indexTypes: IDropdownOption[] = [MongoIndexTypes.Single, MongoIndexTypes.Wildcard].map(
    (value: MongoIndexTypes) => ({
      text: getMongoIndexTypeText(value),
      key: value,
    }),
  );

  private onDescriptionChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => {
    this.props.onIndexAddOrChange(newValue, this.props.type);
  };

  private onTypeChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    const newType = MongoIndexTypes[option.key as keyof typeof MongoIndexTypes];
    this.props.onIndexAddOrChange(this.props.description, newType);
  };

  private setRef = (textField: ITextField) => (this.descriptionTextField = textField);

  public focus = (): void => {
    this.descriptionTextField.focus();
  };

  public render(): JSX.Element {
    return (
      <Stack {...mongoWarningStackProps}>
        <Stack horizontal tokens={addMongoIndexSubElementsTokens}>
          <TextField
            ariaLabel={"Index Field Name " + this.props.position}
            disabled={this.props.disabled}
            styles={shortWidthTextFieldStyles}
            componentRef={this.setRef}
            value={this.props.description}
            placeholder={this.props.type === MongoIndexTypes.Wildcard ? MongoWildcardPlaceHolder : undefined}
            onChange={this.onDescriptionChange}
          />

          <Dropdown
            ariaLabel={"Index Type " + this.props.position}
            disabled={this.props.disabled}
            styles={shortWidthDropDownStyles}
            placeholder="Select an index type"
            selectedKey={this.props.type}
            options={this.indexTypes}
            onChange={this.onTypeChange}
          />

          <IconButton
            ariaLabel={"Undo Button " + this.props.position}
            iconProps={{ iconName: "Undo" }}
            disabled={!this.props.description && !this.props.type}
            onClick={() => this.props.onDiscard()}
          />
        </Stack>
        {this.props.notification?.type === MongoNotificationType.Error && (
          <MessageBar styles={mongoErrorMessageStyles} messageBarType={MessageBarType.error}>
            {this.props.notification.message}
          </MessageBar>
        )}
      </Stack>
    );
  }
}
