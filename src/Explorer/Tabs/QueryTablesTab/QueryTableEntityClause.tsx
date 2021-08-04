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
import AddIcon from "../../../../images/Add.svg";
import CancelIcon from "../../../../images/cancel.svg";
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
}: IQueryTableEntityClauseProps): JSX.Element => {
  const cancelImageProps: IImageProps = {
    width: 14,
    height: 25,
  };

  const addImageProps: IImageProps = {
    width: 18,
    height: 25,
  };

  const sectionStackTokens: IStackTokens = { childrenGap: 12 };

  return (
    <>
      <Stack horizontal tokens={sectionStackTokens}>
        <TooltipHost content="Add new clause" id="addNewClause">
          <Image {...addImageProps} src={AddIcon} alt="Add new clause" id="addNewClause" onClick={onAddNewClause} />
        </TooltipHost>
        <TooltipHost content="Delete clause" id="deleteClause">
          <Image
            {...cancelImageProps}
            src={CancelIcon}
            alt="delete clause"
            id="deleteClause"
            onClick={onDeleteClause}
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
          id="operatorOptionId"
          styles={dropdownStyles}
        />
        <Dropdown
          selectedKey={selectedField}
          onChange={(_event: React.FormEvent<HTMLElement>, selectedOption: IDropdownOption) =>
            onDropdownChange(selectedOption, "selectedField")
          }
          options={fieldOptions}
          id="fieldOptionId"
          styles={dropdownStyles}
        />
        <Dropdown
          selectedKey={selectedEntityType}
          onChange={(_event: React.FormEvent<HTMLElement>, selectedOption: IDropdownOption) =>
            onDropdownChange(selectedOption, "selectedEntityType")
          }
          options={entityTypeOptions}
          id="entityOptionId"
          disabled={selectedField !== "t3PN"}
          styles={dropdownStyles}
        />
        <Dropdown
          selectedKey={selectedOperator}
          onChange={(_event: React.FormEvent<HTMLElement>, selectedOption: IDropdownOption) =>
            onDropdownChange(selectedOption, "selectedOperator")
          }
          options={operatorOptions}
          id="operatorOptionId"
          styles={dropdownStyles}
        />
        {isTimeStampSelected ? (
          <Dropdown
            selectedKey={selectedTimestamp}
            onChange={(_event: React.FormEvent<HTMLElement>, selectedOption: IDropdownOption) =>
              onDropdownChange(selectedOption, "selectedTimestamp")
            }
            options={timestampOptions}
            id="operatorOptionId"
            styles={dropdownStyles}
          />
        ) : (
          <TextField
            // id="entityValueId"
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
