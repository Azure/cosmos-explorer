import { DatePicker, TextField } from "@fluentui/react";
import React, { FunctionComponent } from "react";
import { attributeValueLabel } from "../Explorer/Panes/Tables/Validators/EntityTableHelper";

export interface TableEntityProps {
  entityValueLabel?: string;
  entityValuePlaceholder: string;
  entityValue: string | Date;
  isEntityTypeDate: boolean;
  isEntityValueDisable?: boolean;
  entityTimeValue: string;
  entityValueType: string;
  entityProperty: string;
  onEntityValueChange: (event: React.FormEvent<HTMLElement>, newInput?: string) => void;
  onSelectDate: (date: Date | null | undefined) => void;
  onEntityTimeValueChange: (event: React.FormEvent<HTMLElement>, newInput?: string) => void;
}

export const EntityValue: FunctionComponent<TableEntityProps> = ({
  entityValueLabel,
  entityValuePlaceholder,
  entityValue,
  isEntityTypeDate,
  entityTimeValue,
  entityValueType,
  onEntityValueChange,
  onSelectDate,
  isEntityValueDisable,
  onEntityTimeValueChange,
  entityProperty,
}: TableEntityProps): JSX.Element => {
  if (isEntityTypeDate) {
    return (
      <>
        <DatePicker
          className="addEntityDatePicker"
          placeholder={entityValuePlaceholder}
          value={entityValue ? new Date(entityValue) : new Date()}
          ariaLabel={entityValuePlaceholder}
          onSelectDate={onSelectDate}
          disabled={isEntityValueDisable}
        />
        <TextField
          label={entityValueLabel && entityValueLabel}
          autoFocus
          type="time"
          value={entityTimeValue}
          onChange={onEntityTimeValueChange}
          disabled={isEntityValueDisable}
        />
      </>
    );
  }

  return (
    <>
      <span id={entityProperty} className="screenReaderOnly">
        Edit Property {entityProperty} {attributeValueLabel}
      </span>
      <TextField
        label={entityValueLabel && entityValueLabel}
        className="addEntityTextField"
        disabled={isEntityValueDisable}
        type={entityValueType}
        placeholder={entityValuePlaceholder}
        value={typeof entityValue === "string" ? entityValue : ""}
        onChange={onEntityValueChange}
        aria-labelledby={entityProperty}
      />
    </>
  );
};
