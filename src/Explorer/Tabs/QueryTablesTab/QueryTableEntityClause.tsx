import {
  Checkbox,
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
import AddIcon from "../../../../images/Add-property.svg";
import CancelIcon from "../../../../images/Entity_cancel.svg";
import { userContext } from "../../../UserContext";
import { IOption } from "./QueryTableTabUtils";
const dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 100 } };

export interface IQueryTableEntityClauseProps {
  index: number;
  entityValue: string;
  entityValuePlaceHolder?: string;
  selectedOperator: string;
  selectedOperation: string;
  operatorOptions: IOption[];
  operationOptions: IOption[];
  isQueryTableEntityChecked: boolean;
  selectedField: string;
  fieldOptions: IOption[];
  entityTypeOptions: IOption[];
  selectedEntityType: string;
  isTimeStampSelected?: boolean;
  selectedTimestamp: string;
  timestampOptions: IOption[];
  onAddNewClause?: () => void;
  onDeleteClause?: () => void;
  onQueryTableEntityCheck: (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => void;
  onDropdownChange: (selectedOption: IDropdownOption, selectedOptionType: string) => void;
  onEntityValueChange: (event: React.FormEvent<HTMLElement>, newInput?: string) => void;
  onAddNewClauseKeyDown?: (ev: React.KeyboardEvent<HTMLImageElement>) => void;
  onDeleteCaluseKeyDown?: (ev: React.KeyboardEvent<HTMLImageElement>) => void;
}

export const QueryTableEntityClause: FunctionComponent<IQueryTableEntityClauseProps> = ({
  index,
  entityValue,
  entityValuePlaceHolder,
  selectedOperator,
  operatorOptions,
  selectedField,
  isQueryTableEntityChecked,
  fieldOptions,
  entityTypeOptions,
  selectedEntityType,
  selectedOperation,
  operationOptions,
  isTimeStampSelected,
  selectedTimestamp,
  timestampOptions,
  onQueryTableEntityCheck,
  onAddNewClause,
  onDeleteClause,
  onDropdownChange,
  onEntityValueChange,
  onAddNewClauseKeyDown,
  onDeleteCaluseKeyDown,
}: IQueryTableEntityClauseProps): JSX.Element => {
  const cancelImageProps: IImageProps = {
    className: "querybuilder-cancelImg",
  };

  const addImageProps: IImageProps = {
    className: "querybuilder-addpropertyImg",
  };

  const sectionStackTokens: IStackTokens = { childrenGap: 12 };

  const validateEntityTypeOption = (): boolean => {
    if (userContext.apiType === "Cassandra") {
      return true;
    } else if (selectedField === "PartitionKey" || selectedField === "RowKey" || selectedField === "Timestamp") {
      return true;
    }
    return false;
  };

  return (
    <>
      <Stack horizontal tokens={sectionStackTokens}>
        <TooltipHost content="Add new clause" id="addNewClause">
          <Image
            {...addImageProps}
            src={AddIcon}
            alt="Add new clause"
            id="addNewClause"
            onClick={onAddNewClause}
            onKeyDown={onAddNewClauseKeyDown}
            tabIndex={0}
          />
        </TooltipHost>
        <TooltipHost content="Delete clause" id="deleteClause">
          <Image
            {...cancelImageProps}
            src={CancelIcon}
            alt="delete clause"
            id="deleteClause"
            onClick={onDeleteClause}
            onKeyDown={onDeleteCaluseKeyDown}
            tabIndex={0}
          />
        </TooltipHost>
        <Checkbox checked={isQueryTableEntityChecked} onChange={onQueryTableEntityCheck} />
        <Dropdown
          style={{ visibility: index > 0 ? "visible" : "hidden" }}
          selectedKey={selectedOperation}
          onChange={(_event: React.FormEvent<HTMLElement>, selectedOption: IDropdownOption) =>
            onDropdownChange(selectedOption, "selectedOperation")
          }
          options={operationOptions}
          styles={dropdownStyles}
        />
        <Dropdown
          selectedKey={selectedField}
          onChange={(_event: React.FormEvent<HTMLElement>, selectedOption: IDropdownOption) =>
            onDropdownChange(selectedOption, "selectedField")
          }
          options={fieldOptions}
          styles={dropdownStyles}
        />
        <Dropdown
          selectedKey={selectedEntityType}
          onChange={(_event: React.FormEvent<HTMLElement>, selectedOption: IDropdownOption) =>
            onDropdownChange(selectedOption, "selectedEntityType")
          }
          options={entityTypeOptions}
          disabled={validateEntityTypeOption()}
          styles={dropdownStyles}
        />
        <Dropdown
          selectedKey={selectedOperator}
          onChange={(_event: React.FormEvent<HTMLElement>, selectedOption: IDropdownOption) =>
            onDropdownChange(selectedOption, "selectedOperator")
          }
          options={operatorOptions}
          styles={dropdownStyles}
        />
        {isTimeStampSelected ? (
          <Dropdown
            selectedKey={selectedTimestamp}
            onChange={(_event: React.FormEvent<HTMLElement>, selectedOption: IDropdownOption) =>
              onDropdownChange(selectedOption, "selectedTimestamp")
            }
            options={timestampOptions}
            styles={dropdownStyles}
          />
        ) : (
          <TextField
            autoFocus
            placeholder={entityValuePlaceHolder}
            value={entityValue}
            onChange={onEntityValueChange}
            required
          />
        )}
      </Stack>
    </>
  );
};
