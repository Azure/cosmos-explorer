import * as React from "react";
import {
  MessageBar,
  MessageBarType,
  Stack,
  IconButton,
  TextField,
  Dropdown,
  IDropdownOption,
  ITextFieldProps,
  ITextField
} from "office-ui-fabric-react";
import { titleAndInputStackProps } from "../../SettingsRenderUtils";
import { MongoIndexTypes } from "../../SettingsUtils";

export interface AddMongoIndexComponentProps {
  description: string;
  type: MongoIndexTypes;
  errorMessage: string;
  onIndexAddOrChange: (description: string, type: MongoIndexTypes) => void;
  onDiscard: () => void;
  setRef: (textField: ITextField) => void;
}

interface AddMongoIndexComponentState {}

export class AddMongoIndexComponent extends React.Component<AddMongoIndexComponentProps, AddMongoIndexComponentState> {
  private indexTypes: IDropdownOption[] = [MongoIndexTypes.Single, MongoIndexTypes.WildCard].map((value: string) => ({
    text: value,
    key: value
  }));

  constructor(props: AddMongoIndexComponentProps) {
    super(props);
    this.state = {};
  }

  public render(): JSX.Element {
    return (
      <Stack {...titleAndInputStackProps}>
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <TextField
            styles={{ root: { width: 300 } }}
            componentRef={this.props.setRef}
            label="Defintion"
            value={this.props.description}
            placeholder={this.props.type === MongoIndexTypes.WildCard ? "placeholder.$**" : undefined}
            onChange={(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
              this.props.onIndexAddOrChange(newValue, this.props.type);
            }}
          />

          <Dropdown
            styles={{ dropdown: { width: 300 } }}
            placeholder="Select an index type"
            label="Type"
            selectedKey={this.props.type}
            options={this.indexTypes}
            onChange={(event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption, index?: number) => {
              const newType = MongoIndexTypes[option.key as keyof typeof MongoIndexTypes];
              this.props.onIndexAddOrChange(this.props.description, newType);
            }}
          />

          <IconButton
            iconProps={{ iconName: "Undo" }}
            disabled={!this.props.description && !this.props.type}
            onClick={() => this.props.onDiscard()}
          />
        </Stack>
        {this.props.errorMessage && (
          <MessageBar className="AddMongoIndexError" messageBarType={MessageBarType.error}>
            {this.props.errorMessage}
          </MessageBar>
        )}
      </Stack>
    );
  }
}
