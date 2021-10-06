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
          selectedKey={selectedKey}
          onChange={onParamKeyChange}
          options={options}
          styles={dropdownStyles}
          tabIndex={0}
        />
        <TextField
          label={inputLabel && inputLabel}
          id="confirmCollectionId"
          value={paramValue}
          onChange={onParamValueChange}
        />
        {isAddRemoveVisible && (
          <>
            <div tabIndex={0} onClick={onDeleteParamKeyPress} role="button" onKeyPress={onDeleteParamKeyPress}>
              <Image {...imageProps} src={EntityCancelIcon} alt="Delete param" id="deleteparam" />
            </div>
            <div tabIndex={0} onClick={onAddNewParamKeyPress} role="button" onKeyPress={onAddNewParamKeyPress}>
              <Image {...imageProps} src={AddPropertyIcon} alt="Add param" id="addparam" />
            </div>
          </>
        )}
      </Stack>
    </>
  );
};
