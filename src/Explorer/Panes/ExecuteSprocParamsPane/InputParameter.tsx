import {
  Dropdown,
  IDropdownOption,
  IDropdownStyles,
  IImageProps,
  Image,
  Label,
  Stack,
  TextField,
} from "@fluentui/react";
import React, { FunctionComponent } from "react";
import AddPropertyIcon from "../../../../images/Add-property.svg";
import EntityCancelIcon from "../../../../images/Entity_cancel.svg";

const dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 100 } };
const options = [
  { key: "string", text: "String" },
  { key: "custom", text: "Custom" },
];

export interface InputParameterProps {
  dropdownLabel?: string;
  inputParameterTitle?: string;
  inputLabel?: string;
  isAddRemoveVisible: boolean;
  onDeleteParamKeyPress?: () => void;
  onAddNewParamKeyPress?: () => void;
  onParamValueChange: (event: React.FormEvent<HTMLElement>, newInput?: string) => void;
  onParamKeyChange: (event: React.FormEvent<HTMLElement>, selectedParam: IDropdownOption) => void;
  paramValue: string;
  selectedKey: string | number;
}

export const InputParameter: FunctionComponent<InputParameterProps> = ({
  dropdownLabel,
  inputParameterTitle,
  inputLabel,
  isAddRemoveVisible,
  paramValue,
  selectedKey,
  onDeleteParamKeyPress,
  onAddNewParamKeyPress,
  onParamValueChange,
  onParamKeyChange,
}: InputParameterProps): JSX.Element => {
  const imageProps: IImageProps = {
    width: 20,
    height: 30,
    className: dropdownLabel ? "addRemoveIconLabel" : "addRemoveIcon",
  };

  return (
    <>
      {inputParameterTitle && <Label>{inputParameterTitle}</Label>}
      <Stack horizontal>
        <Dropdown
          label={dropdownLabel && dropdownLabel}
          defaultSelectedKey={selectedKey}
          onChange={onParamKeyChange}
          options={options}
          styles={dropdownStyles}
          tabIndex={0}
          ariaLabel="Key"
        />
        <TextField
          label={inputLabel && inputLabel}
          id="confirmCollectionId"
          defaultValue={paramValue}
          onChange={onParamValueChange}
          tabIndex={0}
        />
        {isAddRemoveVisible && (
          <>
            <div tabIndex={0}>
              <Image
                {...imageProps}
                src={EntityCancelIcon}
                alt="Delete param"
                id="deleteparam"
                role="button"
                onClick={onDeleteParamKeyPress}
              />
            </div>
            <div tabIndex={0}>
              <Image
                {...imageProps}
                src={AddPropertyIcon}
                alt="Add param"
                id="addparam"
                role="button"
                onClick={onAddNewParamKeyPress}
              />
            </div>
          </>
        )}
      </Stack>
    </>
  );
};
