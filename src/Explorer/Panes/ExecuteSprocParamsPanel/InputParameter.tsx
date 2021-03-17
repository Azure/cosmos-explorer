import {
  Dropdown,
  IDropdownOption,
  IDropdownStyles,
  IImageProps,
  Image,
  Label,
  Stack,
  TextField,
} from "office-ui-fabric-react/lib";
import React, { FunctionComponent } from "react";
import Add_property from "../../../../images/Add-property.svg";
import Entity_cancel from "../../../../images/Entity_cancel.svg";

const dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 100 } };
const options = [
  { key: "string", text: "String" },
  { key: "custom", text: "Custom" },
];

interface InputParameterProps {
  dropdownLabel?: string;
  InputParameterTitle?: string;
  inputLabel?: string;
  isAddRemoveVisible: boolean;
}

export const InputParameter: FunctionComponent<InputParameterProps> = ({
  dropdownLabel,
  InputParameterTitle,
  inputLabel,
  isAddRemoveVisible,
}: InputParameterProps): JSX.Element => {
  const [selectedItem, setSelectedItem] = React.useState<IDropdownOption>(options[0]);

  const onChange = (event: React.FormEvent<HTMLDivElement>, item: IDropdownOption): void => {
    setSelectedItem(item);
  };

  const imageProps: IImageProps = {
    width: 20,
    height: 30,
    className: dropdownLabel ? "add-remove-icon-label" : "add-remove-icon",
  };

  return (
    <>
      {InputParameterTitle && <Label>{InputParameterTitle}</Label>}
      <Stack horizontal>
        <Dropdown
          label={dropdownLabel && dropdownLabel}
          selectedKey={selectedItem ? selectedItem.key : undefined}
          onChange={onChange}
          options={options}
          styles={dropdownStyles}
        />
        <TextField label={inputLabel && inputLabel} />
        {isAddRemoveVisible && (
          <>
            <Image {...imageProps} src={Entity_cancel} alt="Delete param" />
            <Image {...imageProps} src={Add_property} alt="Add param" />
          </>
        )}
      </Stack>
    </>
  );
};
