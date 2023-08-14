import {
  Dropdown,
  IDropdownOption,
  IDropdownStyles,
  IImageProps,
  Image,
  IStackTokens,
  Stack,
  TextField,
  TooltipHost,
} from "@fluentui/react";
import React, { FunctionComponent } from "react";
import DeleteIcon from "../../images/delete.svg";
import EditIcon from "../../images/Edit_entity.svg";
import { CassandraType, TableType } from "../Explorer/Tables/Constants";
import { userContext } from "../UserContext";
import { EntityValue } from "./EntityValue";

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
  isEntityValueDisable?: boolean;
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
  isEntityValueDisable,
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

  const handleKeyPress = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === "Space") {
      onEditEntity();
    }
  };
  const handleKeyPressdelete = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === "Space") {
      onDeleteEntity();
    }
  };

  const getEntityValueType = (): string => {
    const { Int, Smallint, Tinyint } = CassandraType;
    const { Double, Int32, Int64 } = TableType;

    if (
      selectedKey === Double ||
      selectedKey === Int32 ||
      selectedKey === Int64 ||
      selectedKey === Int ||
      selectedKey === Smallint ||
      selectedKey === Tinyint
    ) {
      return "number";
    }
    return "string";
  };

  return (
    <>
      <Stack horizontal tokens={sectionStackTokens}>
        <TextField
          label={entityPropertyLabel && entityPropertyLabel}
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
          styles={dropdownStyles}
        />
        <EntityValue
          entityValueLabel={entityValueLabel}
          entityValueType={getEntityValueType()}
          isEntityValueDisable={isEntityValueDisable}
          entityValuePlaceholder={entityValuePlaceholder}
          entityValue={entityValue}
          isEntityTypeDate={isEntityTypeDate}
          entityTimeValue={entityTimeValue}
          onEntityValueChange={onEntityValueChange}
          onSelectDate={onSelectDate}
          onEntityTimeValueChange={onEntityTimeValueChange}
        />
        {!isEntityValueDisable && (
          <TooltipHost content="Edit property" id="editTooltip">
            <div>
              <Image
                {...imageProps}
                src={EditIcon}
                alt="editEntity"
                onClick={onEditEntity}
                tabIndex={0}
                onKeyPress={handleKeyPress}
              />
            </div>
          </TooltipHost>
        )}
        {isDeleteOptionVisible && userContext.apiType !== "Cassandra" && (
          <TooltipHost content="Delete property" id="deleteTooltip">
            <Image
              {...imageProps}
              src={DeleteIcon}
              alt="delete entity"
              id="deleteEntity"
              onClick={onDeleteEntity}
              tabIndex={0}
              onKeyPress={handleKeyPressdelete}
            />
          </TooltipHost>
        )}
      </Stack>
    </>
  );
};
