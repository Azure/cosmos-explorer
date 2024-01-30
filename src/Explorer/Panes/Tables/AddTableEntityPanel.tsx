import { IDropdownOption, Image, Label, Stack, Text, TextField } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { logConsoleError } from "Utils/NotificationConsoleUtils";
import React, { FunctionComponent, useEffect, useState } from "react";
import * as _ from "underscore";
import AddPropertyIcon from "../../../../images/Add-property.svg";
import RevertBackIcon from "../../../../images/RevertBack.svg";
import { getErrorMessage, handleError } from "../../../Common/ErrorHandlingUtils";
import { TableEntity } from "../../../Common/TableEntity";
import { userContext } from "../../../UserContext";
import * as TableConstants from "../../Tables/Constants";
import * as DataTableUtilities from "../../Tables/DataTable/DataTableUtilities";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import * as Entities from "../../Tables/Entities";
import { CassandraAPIDataClient, CassandraTableKey, TableDataClient } from "../../Tables/TableDataClient";
import * as TableEntityProcessor from "../../Tables/TableEntityProcessor";
import * as Utilities from "../../Tables/Utilities";
import QueryTablesTab from "../../Tabs/QueryTablesTab";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";
import {
  attributeNameLabel,
  attributeValueLabel,
  backImageProps,
  cassandraOptions,
  columnProps,
  dataTypeLabel,
  detailedHelp,
  entityFromAttributes,
  getAddButtonLabel,
  getButtonLabel,
  getCassandraDefaultEntities,
  getDefaultEntities,
  getEntityValuePlaceholder,
  imageProps,
  options,
} from "./Validators/EntityTableHelper";

interface AddTableEntityPanelProps {
  tableDataClient: TableDataClient;
  queryTablesTab: QueryTablesTab;
  tableEntityListViewModel: TableEntityListViewModel;
  cassandraApiClient: CassandraAPIDataClient;
}

interface EntityRowType {
  property: string;
  type: string;
  value: string;
  isPropertyTypeDisable: boolean;
  isDeleteOptionVisible: boolean;
  id: number;
  entityValuePlaceholder: string;
  isEntityTypeDate: boolean;
  entityTimeValue?: string;
}

export const AddTableEntityPanel: FunctionComponent<AddTableEntityPanelProps> = ({
  tableDataClient,
  queryTablesTab,
  tableEntityListViewModel,
  cassandraApiClient,
}: AddTableEntityPanelProps): JSX.Element => {
  const [entities, setEntities] = useState<EntityRowType[]>([]);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [entityAttributeValue, setEntityAttributeValue] = useState<string>("");
  const [entityAttributeProperty, setEntityAttributeProperty] = useState<string>("");
  const [isEntityValuePanelOpen, { setTrue: setIsEntityValuePanelTrue, setFalse: setIsEntityValuePanelFalse }] =
    useBoolean(false);
  const [formError, setFormError] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  /* Get default and previous saved entity headers */
  useEffect(() => {
    getDefaultEntitiesAttribute();
  }, []);

  const getDefaultEntitiesAttribute = async (): Promise<void> => {
    let headers = tableEntityListViewModel.headers;
    if (DataTableUtilities.checkForDefaultHeader(headers)) {
      headers = [];
      if (userContext.apiType === "Tables") {
        headers = [TableConstants.EntityKeyNames.PartitionKey, TableConstants.EntityKeyNames.RowKey];
      }
    }
    if (userContext.apiType === "Cassandra") {
      const columns: CassandraTableKey[] = await cassandraApiClient.getTableSchema(queryTablesTab.collection);
      const cassandraEntities = Utilities.getDataTypesFromCassandraSchema(columns);
      const cassandraDefaultEntities: EntityRowType[] = getCassandraDefaultEntities(headers, cassandraEntities);
      setEntities(cassandraDefaultEntities);
    } else {
      const entityItems = tableEntityListViewModel.items();
      const entityTypes = Utilities.getDataTypesFromEntities(headers, entityItems);
      const defaultEntities: EntityRowType[] = getDefaultEntities(headers, entityTypes);
      setEntities(defaultEntities);
    }
  };

  /* Add new entity attribute */
  const onSubmit = async (): Promise<void> => {
    for (let i = 0; i < entities.length; i++) {
      const { property, type, value } = entities[i];
      if (property === "" || property === undefined) {
        setFormError(`Property name cannot be empty. Please enter a property name`);
        return;
      }

      if (
        (property === "PartitionKey" && value === "") ||
        (property === "PartitionKey" && value === undefined) ||
        (property === "RowKey" && value === "") ||
        (property === "RowKey" && value === undefined)
      ) {
        logConsoleError(`${property} cannot be empty. Please input a value for ${property}`);
        setFormError(`${property} cannot be empty. Please input a value for ${property}`);
        return;
      }

      if (!type) {
        setFormError(`Property type cannot be empty. Please select a type from the dropdown for property ${property}`);
        return;
      }

      setFormError("");
    }

    setIsExecuting(true);
    const entity: Entities.ITableEntity = entityFromAttributes(entities);
    const newEntity: Entities.ITableEntity = await tableDataClient.createDocument(queryTablesTab.collection, entity);
    try {
      await tableEntityListViewModel.addEntityToCache(newEntity);
      if (!tryInsertNewHeaders(tableEntityListViewModel, newEntity)) {
        tableEntityListViewModel.redrawTableThrottled();
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setFormError(errorMessage);
      handleError(errorMessage, "AddTableRow");
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  const tryInsertNewHeaders = (viewModel: TableEntityListViewModel, newEntity: Entities.ITableEntity): boolean => {
    let newHeaders: string[] = [];
    const keys = Object.keys(newEntity);
    keys &&
      keys.forEach((key: string) => {
        if (
          !_.contains(viewModel.headers, key) &&
          key !== TableEntityProcessor.keyProperties.attachments &&
          key !== TableEntityProcessor.keyProperties.etag &&
          key !== TableEntityProcessor.keyProperties.resourceId &&
          key !== TableEntityProcessor.keyProperties.self &&
          (!(userContext.apiType === "Cassandra") || key !== TableConstants.EntityKeyNames.RowKey)
        ) {
          newHeaders.push(key);
        }
      });

    let newHeadersInserted = false;
    if (newHeaders.length) {
      if (!DataTableUtilities.checkForDefaultHeader(viewModel.headers)) {
        newHeaders = viewModel.headers.concat(newHeaders);
      }
      viewModel.updateHeaders(newHeaders, /* notifyColumnChanges */ true, /* enablePrompt */ false);
      newHeadersInserted = true;
    }
    return newHeadersInserted;
  };

  /* Add new entity row */
  const addNewEntity = (): void => {
    const cloneEntities: EntityRowType[] = [...entities];
    cloneEntities.splice(cloneEntities.length, 0, {
      property: "",
      type: "String",
      value: "",
      isPropertyTypeDisable: false,
      isDeleteOptionVisible: true,
      id: cloneEntities.length + 1,
      entityValuePlaceholder: "",
      isEntityTypeDate: false,
    });
    setEntities(cloneEntities);
  };

  /* Delete entity row */
  const deleteEntityAtIndex = (indexToRemove: number): void => {
    const cloneEntities: EntityRowType[] = [...entities];
    cloneEntities.splice(indexToRemove, 1);
    setEntities(cloneEntities);
  };

  /* handle Entity change */
  const entityChange = (value: string | Date, indexOfInput: number, key: string): void => {
    const cloneEntities: EntityRowType[] = [...entities];
    if (key === "property") {
      cloneEntities[indexOfInput].property = value.toString().trim();
    } else if (key === "time") {
      cloneEntities[indexOfInput].entityTimeValue = value.toString();
    } else if (
      cloneEntities[indexOfInput].property === "PartitionKey" ||
      cloneEntities[indexOfInput].property === "RowKey"
    ) {
      cloneEntities[indexOfInput].value = value.toString().trim();
    } else {
      cloneEntities[indexOfInput].value = value.toString();
    }
    setEntities(cloneEntities);
  };

  /* handle Entity type */
  const entityTypeChange = (
    _event: React.FormEvent<HTMLDivElement>,
    selectedType: IDropdownOption,
    indexOfEntity: number,
  ): void => {
    const entityValuePlaceholder: string = getEntityValuePlaceholder(selectedType.key);
    const cloneEntities: EntityRowType[] = [...entities];
    cloneEntities[indexOfEntity].type = selectedType.key.toString();
    cloneEntities[indexOfEntity].entityValuePlaceholder = entityValuePlaceholder;
    cloneEntities[indexOfEntity].isEntityTypeDate = selectedType.key === "DateTime";
    setEntities(cloneEntities);
  };

  /* Open edit entity value modal */
  const editEntity = (rowEndex: number): void => {
    const entityAttribute: EntityRowType = entities[rowEndex] && entities[rowEndex];
    setEntityAttributeValue(entityAttribute.value);
    setEntityAttributeProperty(entityAttribute.property);
    setSelectedRow(rowEndex);
    setIsEntityValuePanelTrue();
  };
  const handlePress = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Enter" || event.key === "Space") {
      setIsEntityValuePanelFalse();
    }
  };

  if (isEntityValuePanelOpen) {
    return (
      <Stack style={{ padding: "20px 34px" }}>
        <Stack horizontal {...columnProps}>
          <Image
            {...backImageProps}
            src={RevertBackIcon}
            alt="back"
            tabIndex={0}
            onClick={setIsEntityValuePanelFalse}
            onKeyPress={handlePress}
          />
          <Label>{entityAttributeProperty}</Label>
        </Stack>
        <TextField
          multiline
          rows={5}
          value={entityAttributeValue}
          onChange={(event, newInput?: string) => {
            entityChange(newInput, selectedRow, "value");
            setEntityAttributeValue(newInput);
          }}
        />
      </Stack>
    );
  }

  const props: RightPaneFormProps = {
    formError,
    isExecuting,
    submitButtonText: getButtonLabel(userContext.apiType),
    onSubmit,
  };
  const handlekeypressaddentity = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === "Space") {
      addNewEntity();
    }
  };

  return (
    <RightPaneForm {...props}>
      <div className="panelMainContent">
        {entities.map((entity, index) => {
          return (
            <TableEntity
              key={"" + entity.id + index}
              isDeleteOptionVisible={entity.isDeleteOptionVisible}
              entityTypeLabel={index === 0 && dataTypeLabel}
              entityPropertyLabel={index === 0 && attributeNameLabel}
              entityValueLabel={index === 0 && attributeValueLabel}
              options={userContext.apiType === "Cassandra" ? cassandraOptions : options}
              isPropertyTypeDisable={entity.isPropertyTypeDisable}
              entityProperty={entity.property}
              selectedKey={entity.type}
              entityPropertyPlaceHolder={detailedHelp}
              entityValuePlaceholder={entity.entityValuePlaceholder}
              entityValue={entity.value}
              isEntityTypeDate={entity.isEntityTypeDate}
              entityTimeValue={entity.entityTimeValue}
              onEditEntity={() => editEntity(index)}
              onSelectDate={(date: Date) => {
                entityChange(date, index, "value");
              }}
              onDeleteEntity={() => deleteEntityAtIndex(index)}
              onEntityPropertyChange={(event, newInput?: string) => {
                entityChange(newInput, index, "property");
              }}
              onEntityTypeChange={(event: React.FormEvent<HTMLDivElement>, selectedParam: IDropdownOption) => {
                entityTypeChange(event, selectedParam, index);
              }}
              onEntityValueChange={(event, newInput?: string) => {
                entityChange(newInput, index, "value");
              }}
              onEntityTimeValueChange={(event, newInput?: string) => {
                entityChange(newInput, index, "time");
              }}
            />
          );
        })}
        {userContext.apiType !== "Cassandra" && (
          <Stack
            horizontal
            onClick={addNewEntity}
            className="addButtonEntiy"
            tabIndex={0}
            onKeyPress={handlekeypressaddentity}
            aria-label="Add Property"
          >
            <Image {...imageProps} src={AddPropertyIcon} alt="Add Property" />
            <Text className="addNewParamStyle">{getAddButtonLabel(userContext.apiType)}</Text>
          </Stack>
        )}
      </div>
    </RightPaneForm>
  );
};
