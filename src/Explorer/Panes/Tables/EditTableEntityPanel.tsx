import { IDropdownOption, Image, Label, Stack, Text, TextField } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
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
import { CassandraAPIDataClient, TableDataClient } from "../../Tables/TableDataClient";
import * as TableEntityProcessor from "../../Tables/TableEntityProcessor";
import QueryTablesTab from "../../Tabs/QueryTablesTab";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";
import {
  attributeNameLabel,
  attributeValueLabel,
  backImageProps,
  cassandraOptions,
  columnProps,
  dataTypeLabel,
  defaultStringPlaceHolder,
  detailedHelp,
  entityFromAttributes,
  getAddButtonLabel,
  getEntityValuePlaceholder,
  getFormattedTime,
  imageProps,
  options,
} from "./Validators/EntityTableHelper";

interface EditTableEntityPanelProps {
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
  isEntityValueDisable?: boolean;
}

export const EditTableEntityPanel: FunctionComponent<EditTableEntityPanelProps> = ({
  tableDataClient,
  queryTablesTab,
  tableEntityListViewModel,
  cassandraApiClient,
}: EditTableEntityPanelProps): JSX.Element => {
  const [entities, setEntities] = useState<EntityRowType[]>([]);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [entityAttributeValue, setEntityAttributeValue] = useState<string>("");
  const [originalDocument, setOriginalDocument] = useState<Entities.ITableEntity>({});
  const [entityAttributeProperty, setEntityAttributeProperty] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const [isEntityValuePanelOpen, { setTrue: setIsEntityValuePanelTrue, setFalse: setIsEntityValuePanelFalse }] =
    useBoolean(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let originalDocument: { [key: string]: any } = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entityAttribute: any = tableEntityListViewModel.selected();
    const entityFormattedAttribute = constructDisplayedAttributes(entityAttribute[0]);
    setEntities(entityFormattedAttribute);

    if (userContext.apiType === "Tables") {
      originalDocument = TableEntityProcessor.convertEntitiesToDocuments(entityAttribute, queryTablesTab.collection)[0];
      originalDocument.id = (): string => originalDocument.$id;
    } else {
      originalDocument = entityAttribute;
    }
    setOriginalDocument(originalDocument);
  }, []);

  const constructDisplayedAttributes = (entity: Entities.ITableEntity): EntityRowType[] => {
    const displayedAttributes: EntityRowType[] = [];
    const keys = Object.keys(entity);
    keys.length &&
      keys.forEach((key: string) => {
        if (
          key !== TableEntityProcessor.keyProperties.attachments &&
          key !== TableEntityProcessor.keyProperties.etag &&
          key !== TableEntityProcessor.keyProperties.resourceId &&
          key !== TableEntityProcessor.keyProperties.self &&
          (userContext.apiType !== "Cassandra" || key !== TableConstants.EntityKeyNames.RowKey)
        ) {
          if (userContext.apiType === "Cassandra") {
            const cassandraKeys = queryTablesTab.collection.cassandraKeys.partitionKeys
              .concat(queryTablesTab.collection.cassandraKeys.clusteringKeys)
              .map((key) => key.property);
            const entityAttribute: Entities.ITableEntityAttribute = entity[key];
            const entityAttributeType: string = entityAttribute.$;
            const displayValue: string = getPropertyDisplayValue(entity, key, entityAttributeType);
            const nonEditableType: boolean =
              entityAttributeType === TableConstants.CassandraType.Blob ||
              entityAttributeType === TableConstants.CassandraType.Inet;
            const isDisable = !_.contains<string>(cassandraKeys, key) && !nonEditableType;
            const time =
              entityAttributeType === TableConstants.TableType.DateTime ? getFormattedTime(displayValue) : "";
            displayedAttributes.push({
              property: key,
              type: entityAttributeType,
              value: displayValue,
              isPropertyTypeDisable: !nonEditableType,
              isDeleteOptionVisible: isDisable,
              id: displayedAttributes.length,
              entityValuePlaceholder: defaultStringPlaceHolder,
              isEntityTypeDate: entityAttributeType === "DateTime",
              isEntityValueDisable: !isDisable,
              entityTimeValue: time,
            });
          } else {
            const entityAttribute: Entities.ITableEntityAttribute = entity[key];
            const entityAttributeType: string = entityAttribute.$;
            const displayValue: string = getPropertyDisplayValue(entity, key, entityAttributeType);
            const editable: boolean = isAttributeEditable(key, entityAttributeType);
            // As per VSO:189935, Binary properties are read-only, we still want to be able to remove them.
            const removable: boolean = editable || entityAttributeType === TableConstants.TableType.Binary;
            const time =
              entityAttributeType === TableConstants.TableType.DateTime ? getFormattedTime(displayValue) : "";
            displayedAttributes.push({
              property: key,
              type: entityAttributeType,
              value: displayValue,
              isPropertyTypeDisable: !editable,
              isDeleteOptionVisible: removable,
              id: displayedAttributes.length,
              entityValuePlaceholder: defaultStringPlaceHolder,
              isEntityTypeDate: entityAttributeType === "DateTime",
              isEntityValueDisable: !editable,
              entityTimeValue: time,
            });
          }
        }
      });
    return displayedAttributes;
  };

  const isAttributeEditable = (attributeName: string, entityAttributeType: string) => {
    return !(
      attributeName === TableConstants.EntityKeyNames.PartitionKey ||
      attributeName === TableConstants.EntityKeyNames.RowKey ||
      attributeName === TableConstants.EntityKeyNames.Timestamp ||
      // As per VSO:189935, Making Binary properties read-only in Edit Entity dialog until we have a full story for it.
      entityAttributeType === TableConstants.TableType.Binary
    );
  };

  const getPropertyDisplayValue = (entity: Entities.ITableEntity, name: string, type: string): string => {
    const attribute: Entities.ITableEntityAttribute = entity[name];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let displayValue: any = attribute._;
    const isBinary: boolean = type === TableConstants.TableType.Binary;

    // Showing the value in base64 for binary properties since that is what the Azure Storage Client Library expects.
    // This means that, even if the Azure Storage API returns a byte[] of binary content, it needs that same array
    // *base64 - encoded * as the value for the updated property or the whole update operation will fail.
    if (isBinary && displayValue && $.isArray(displayValue.data)) {
      const bytes: number[] = displayValue.data;
      displayValue = getBase64DisplayValue(bytes);
    }
    return displayValue;
  };

  const getBase64DisplayValue = (bytes: number[]): string => {
    let displayValue = "";
    try {
      const chars: string[] = bytes.map((byte: number) => String.fromCharCode(byte));
      const toEncode: string = chars.join("");
      displayValue = window.btoa(toEncode);
    } catch (error) {
      console.error(error);
    }
    return displayValue;
  };

  const onSubmit = async (): Promise<void> => {
    for (let i = 0; i < entities.length; i++) {
      const { property, type } = entities[i];
      if (property === "" || property === undefined) {
        setFormError(`Property name cannot be empty. Please enter a property name`);
        return;
      }

      if (!type) {
        setFormError(`Property type cannot be empty. Please select a type from the dropdown for property ${property}`);
        return;
      }
    }

    setIsExecuting(true);
    const entity: Entities.ITableEntity = entityFromAttributes(entities);
    const newTableDataClient = userContext.apiType === "Cassandra" ? cassandraApiClient : tableDataClient;
    const originalDocumentData = userContext.apiType === "Cassandra" ? originalDocument[0] : originalDocument;

    try {
      const newEntity: Entities.ITableEntity = await newTableDataClient.updateDocument(
        queryTablesTab.collection,
        originalDocumentData,
        entity,
      );
      await tableEntityListViewModel.updateCachedEntity(newEntity);
      if (!tryInsertNewHeaders(tableEntityListViewModel, newEntity)) {
        tableEntityListViewModel.redrawTableThrottled();
      }
      tableEntityListViewModel.selected.removeAll();
      tableEntityListViewModel.selected.push(newEntity);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      handleError(errorMessage, "EditTableRow");
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

  // Add new entity row
  const addNewEntity = (): void => {
    const cloneEntities = [...entities];
    cloneEntities.splice(cloneEntities.length, 0, {
      property: "",
      type: TableConstants.TableType.String,
      value: "",
      isPropertyTypeDisable: false,
      isDeleteOptionVisible: true,
      id: cloneEntities.length + 1,
      entityValuePlaceholder: "",
      isEntityTypeDate: false,
    });
    setEntities(cloneEntities);
  };

  // Delete entity row
  const deleteEntityAtIndex = (indexToRemove: number): void => {
    const cloneEntities = [...entities];
    cloneEntities.splice(indexToRemove, 1);
    setEntities(cloneEntities);
  };

  // handle Entity change
  const entityChange = (value: string | Date, indexOfInput: number, key: string): void => {
    const cloneEntities = [...entities];
    if (key === "property") {
      cloneEntities[indexOfInput].property = value.toString();
    } else if (key === "time") {
      cloneEntities[indexOfInput].entityTimeValue = value.toString();
    } else {
      cloneEntities[indexOfInput].value = value.toString();
    }
    setEntities(cloneEntities);
  };

  // handle Entity type
  const entityTypeChange = (
    _event: React.FormEvent<HTMLDivElement>,
    selectedType: IDropdownOption,
    indexOfEntity: number,
  ): void => {
    const entityValuePlaceholder = getEntityValuePlaceholder(selectedType.key);
    const cloneEntities = [...entities];
    cloneEntities[indexOfEntity].type = selectedType.key.toString();
    cloneEntities[indexOfEntity].entityValuePlaceholder = entityValuePlaceholder;
    cloneEntities[indexOfEntity].isEntityTypeDate = selectedType.key === TableConstants.TableType.DateTime;
    setEntities(cloneEntities);
  };

  // Open edit entity value modal
  const editEntity = (rowEndex: number): void => {
    const entityAttribute: EntityRowType = entities[rowEndex] && entities[rowEndex];
    setEntityAttributeValue(entityAttribute.value);
    setEntityAttributeProperty(entityAttribute.property);
    setSelectedRow(rowEndex);
    setIsEntityValuePanelTrue();
  };

  if (isEntityValuePanelOpen) {
    return (
      <Stack style={{ padding: "20px 34px" }}>
        <Stack horizontal {...columnProps}>
          <Image {...backImageProps} src={RevertBackIcon} alt="back" onClick={() => setIsEntityValuePanelFalse()} />
          <Label>{entityAttributeProperty}</Label>
        </Stack>
        <TextField
          multiline
          rows={5}
          value={entityAttributeValue}
          onChange={(event, newInput?: string) => {
            setEntityAttributeValue(newInput);
            entityChange(newInput, selectedRow, "value");
          }}
        />
      </Stack>
    );
  }

  const props: RightPaneFormProps = {
    formError,
    isExecuting,
    submitButtonText: "Update",
    onSubmit,
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
              entityValue={entity.value?.toString()}
              isEntityTypeDate={entity.isEntityTypeDate}
              entityTimeValue={entity.entityTimeValue}
              isEntityValueDisable={entity.isEntityValueDisable}
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
          <Stack horizontal onClick={addNewEntity} className="addButtonEntiy">
            <Image {...imageProps} src={AddPropertyIcon} alt="Add Entity" />
            <Text className="addNewParamStyle">{getAddButtonLabel(userContext.apiType)}</Text>
          </Stack>
        )}
      </div>
      <div className="panelNullWarning" style={{ padding: "20px", color: "red" }}>
        Warning: Null fields will not be displayed for editing.
      </div>
    </RightPaneForm>
  );
};
