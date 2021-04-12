import {
  DatePicker,
  Dropdown,
  IDropdownOption,
  IDropdownStyles,
  IImageProps,
  Image,
  IStackTokens,
  Stack,
  TextField,
  TooltipHost,
} from "office-ui-fabric-react";
import React, { FunctionComponent } from "react";
import DeleteIcon from "../../../images/delete.svg";
import EditIcon from "../../../images/Edit_entity.svg";

const dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 100 } };

export interface TableEntityProps {
  entityTypeLabel?: string;
  entityPropertyLabel?: string;
  entityValueLabel?: string;
  isDeleteOptionVisible: boolean;
  entityProperty: string;
  entityPropertyPlaceHolder: string;
  selectedKey: string | number;
  entityValuePlaceholder: string;
  entityValue: string | Date;
  isEntityTypeDate: boolean;
  options: { key: string; text: string }[];
  isPropertyTypeDisable: boolean;
  entityTimeValue: string;
  onDeleteEntity?: () => void;
  onEditEntity?: () => void;
  onEntityPropertyChange: (event: React.FormEvent<HTMLElement>, newInput?: string) => void;
  onEntityTypeChange: (event: React.FormEvent<HTMLElement>, selectedParam: IDropdownOption) => void;
  onEntityValueChange: (event: React.FormEvent<HTMLElement>, newInput?: string) => void;
  onSelectDate: (date: Date | null | undefined) => void;
  onEntityTimeValueChange: (event: React.FormEvent<HTMLElement>, newInput?: string) => void;
}

export const TableEntity: FunctionComponent<TableEntityProps> = ({
  entityTypeLabel,
  entityPropertyLabel,
  isDeleteOptionVisible,
  entityProperty,
  selectedKey,
  entityPropertyPlaceHolder,
  entityValueLabel,
  entityValuePlaceholder,
  entityValue,
  options,
  isPropertyTypeDisable,
  isEntityTypeDate,
  entityTimeValue,
  onEditEntity,
  onDeleteEntity,
  onEntityPropertyChange,
  onEntityTypeChange,
  onEntityValueChange,
  onSelectDate,
  onEntityTimeValueChange,
}: TableEntityProps): JSX.Element => {
  const imageProps: IImageProps = {
    width: 16,
    height: 30,
    className: entityPropertyLabel ? "addRemoveIconLabel" : "addRemoveIcon",
  };

  const sectionStackTokens: IStackTokens = { childrenGap: 12 };

  const renderEntityValue = (): JSX.Element => {
    if (isEntityTypeDate) {
      return (
        <>
          <DatePicker
            className="addEntityDatePicker"
            placeholder={entityValuePlaceholder}
            value={entityValue && new Date(entityValue)}
            ariaLabel={entityValuePlaceholder}
            onSelectDate={onSelectDate}
          />
          <TextField
            label={entityValueLabel && entityValueLabel}
            id="entityTimeId"
            autoFocus
            type="time"
            value={entityTimeValue}
            onChange={onEntityTimeValueChange}
          />
        </>
      );
    }
    return (
      <TextField
        label={entityValueLabel && entityValueLabel}
        className="addEntityTextField"
        id="entityValueId"
        autoFocus
        placeholder={entityValuePlaceholder}
        value={typeof entityValue === "string" && entityValue}
        onChange={onEntityValueChange}
      />
    );
  };

  return (
    <>
      <Stack horizontal tokens={sectionStackTokens}>
        <TextField
          label={entityPropertyLabel && entityPropertyLabel}
          id="entityPropertyId"
          autoFocus
          disabled={isPropertyTypeDisable}
          placeholder={entityPropertyPlaceHolder}
          value={entityProperty}
          onChange={onEntityPropertyChange}
          required
        />
        <Dropdown
          label={entityTypeLabel && entityTypeLabel}
          selectedKey={selectedKey}
          onChange={onEntityTypeChange}
          options={options}
          disabled={isPropertyTypeDisable}
          id="entityTypeId"
          styles={dropdownStyles}
        />
        {renderEntityValue()}
        <TooltipHost content="Edit property" id="editTooltip">
          <Image {...imageProps} src={EditIcon} alt="editEntity" id="editEntity" onClick={onEditEntity} />
        </TooltipHost>

        {isDeleteOptionVisible && (
          <TooltipHost content="Delete property" id="deleteTooltip">
            <Image {...imageProps} src={DeleteIcon} alt="delete entity" id="deleteEntity" onClick={onDeleteEntity} />
          </TooltipHost>
        )}
      </Stack>
    </>
  );
};
