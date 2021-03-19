import {
  Dropdown,
  IDropdownOption,
  IDropdownStyles,
  IImageProps,
  Image,
  Label,
  Stack,
  TextField
} from "office-ui-fabric-react/lib";
import React, { FunctionComponent } from "react";
import Add_property from "../../../../images/Add-property.svg";
import Entity_cancel from "../../../../images/Entity_cancel.svg";

const dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 100 } };
const options = [
  { key: "string", text: "String" },
  { key: "custom", text: "Custom" },
];

export interface InputParameterProps {
  dropdownLabel?: string;
  InputParameterTitle?: string;
  inputLabel?: string;
  isAddRemoveVisible: boolean;
  onDeleteParamKeyPress?: () => void;
  onAddNewParamKeyPress?: () => void;
  onParamValueChange: (event: any, newInput?: string) => void,
  onParamKeyChange: (event: React.FormEvent<HTMLDivElement>, selectedParam: IDropdownOption) => void,
  paramValue: string,
  selectedKey: string | number
}

export const InputParameter: FunctionComponent<InputParameterProps> = ({
  dropdownLabel,
  InputParameterTitle,
  inputLabel,
  isAddRemoveVisible,
  onDeleteParamKeyPress,
  onAddNewParamKeyPress,
  onParamValueChange,
  onParamKeyChange,
  paramValue,
  selectedKey
}: InputParameterProps): JSX.Element => {
  const imageProps: IImageProps = {
    width: 20,
    height: 30,
    className: dropdownLabel ? "add-remove-icon-label" : "add-remove-icon",
  };

  console.log("selectedKey", selectedKey, typeof selectedKey)

  return (
    <>
      {InputParameterTitle && <Label>{InputParameterTitle}</Label>}
      <Stack horizontal>
        <Dropdown
          label={dropdownLabel && dropdownLabel}
          selectedKey={selectedKey}
          onChange={onParamKeyChange}
          options={options}
          styles={dropdownStyles}
        />
        <TextField
          label={inputLabel && inputLabel}
          id="confirmCollectionId"
          autoFocus
          value={paramValue}
          onChange={onParamValueChange}
        />
        {isAddRemoveVisible && (
          <>
            <Image {...imageProps} src={Entity_cancel} alt="Delete param" onClick={onDeleteParamKeyPress} />
            <Image {...imageProps} src={Add_property} alt="Add param" onClick={onAddNewParamKeyPress} />
          </>
        )}
      </Stack>
    </>
  );
};
