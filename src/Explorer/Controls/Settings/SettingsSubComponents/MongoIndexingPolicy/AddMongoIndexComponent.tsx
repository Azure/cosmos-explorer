import * as React from "react";
import {
  MessageBar,
  MessageBarType,
  Stack,
  IconButton,
  TextField,
  Dropdown,
  IDropdownOption,
  ITextField
} from "office-ui-fabric-react";
import {
  addMongoIndexSubElementsTokens,
  mongoWarningStackProps,
  shortWidthDropDownStyles,
  shortWidthTextFieldStyles
} from "../../SettingsRenderUtils";
import {
  MongoIndexTypes,
  MongoNotificationMessage,
  MongoNotificationType,
  MongoWildcardPlaceHolder
} from "../../SettingsUtils";

export interface AddMongoIndexComponentProps {
  description: string;
  type: MongoIndexTypes;
  notification: MongoNotificationMessage;
  onIndexAddOrChange: (description: string, type: MongoIndexTypes) => void;
  onDiscard: () => void;
  setRef: (textField: ITextField) => void;
  disabled?: boolean;
}

export class AddMongoIndexComponent extends React.Component<AddMongoIndexComponentProps> {
  private indexTypes: IDropdownOption[] = [MongoIndexTypes.Single, MongoIndexTypes.WildCard].map((value: string) => ({
    text: value,
    key: value
  }));

  constructor(props: AddMongoIndexComponentProps) {
    super(props);
  }

  private onDescriptionChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    this.props.onIndexAddOrChange(newValue, this.props.type);
  };

  private onTypeChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    const newType = MongoIndexTypes[option.key as keyof typeof MongoIndexTypes];
    this.props.onIndexAddOrChange(this.props.description, newType);
  };

  public render(): JSX.Element {
    return (
      <Stack {...mongoWarningStackProps}>
        <Stack horizontal tokens={addMongoIndexSubElementsTokens}>
          <TextField
            disabled={this.props.disabled}
            styles={shortWidthTextFieldStyles}
            componentRef={this.props.setRef}
            value={this.props.description}
            placeholder={this.props.type === MongoIndexTypes.WildCard ? MongoWildcardPlaceHolder : undefined}
            onChange={this.onDescriptionChange}
          />

          <Dropdown
            disabled={this.props.disabled}
            styles={shortWidthDropDownStyles}
            placeholder="Select an index type"
            selectedKey={this.props.type}
            options={this.indexTypes}
            onChange={this.onTypeChange}
          />

          <IconButton
            iconProps={{ iconName: "Undo" }}
            disabled={!this.props.description && !this.props.type}
            onClick={() => this.props.onDiscard()}
          />
        </Stack>
        {this.props.notification?.type === MongoNotificationType.Error && (
          <MessageBar messageBarType={MessageBarType.error}>{this.props.notification.message}</MessageBar>
        )}
      </Stack>
    );
  }
}
