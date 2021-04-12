import { useBoolean } from "@uifabric/react-hooks";
import {
  IDropdownOption,
  Image,
  IPanelProps,
  IRenderFunction,
  Label,
  Stack,
  Text,
  TextField,
} from "office-ui-fabric-react";
import React, { FunctionComponent, useEffect, useState } from "react";
import AddPropertyIcon from "../../../../../images/Add-property.svg";
import RevertBackIcon from "../../../../../images/RevertBack.svg";
import { TableEntity } from "../../../../Common/TableEntity";
import Explorer from "../../../Explorer";
import * as Entities from "../../../Tables/Entities";
import QueryTablesTab from "../../../Tabs/QueryTablesTab";
import { PanelContainerComponent } from "../../PanelContainerComponent";
import {
  addButtonLabel,
  attributeNameLabel,
  attributeValueLabel,
  backImageProps,
  columnProps,
  dataTypeLabel,
  defaultEntities,
  detailedHelp,
  entityFromAttributes,
  EntityRowType,
  getEntityValuePlaceholder,
  imageProps,
  options,
} from "../Validators/EntityTableHelper";

interface AddTableEntityPanelProps {
  explorer: Explorer;
  closePanel: () => void;
  queryTablesTab: QueryTablesTab;
}

export const AddTableEntityPanel: FunctionComponent<AddTableEntityPanelProps> = ({
  explorer,
  closePanel,
  queryTablesTab,
}: AddTableEntityPanelProps): JSX.Element => {
  const [entities, setEntities] = useState<EntityRowType[]>(defaultEntities);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [
    isEntityValuePanelOpen,
    { setTrue: setIsEntityValuePanelTrue, setFalse: setIsEntityValuePanelFalse },
  ] = useBoolean(false);

  // Get default and previous saved entity headers
  useEffect(() => {
    // [Todo] Sunil
    // const headers = tableViewModel.headers;
  }, []);

  const isValidEntities = (entities: EntityRowType[]): boolean => {
    for (let i = 0; i < entities.length; i++) {
      const { property } = entities[i];
      if (property === "" || property === undefined) {
        return false;
      }
    }
    return true;
  };

  const submit = (): void => {
    if (!isValidEntities(entities)) {
      return undefined;
    }
    const entity: Entities.ITableEntity = entityFromAttributes(entities);
    explorer.tableDataClient
      .createDocument(queryTablesTab.collection, entity)
      .then((newEntity: Entities.ITableEntity) => {
        console.log("newEntity", newEntity);
        // [Todo: Sunil]: Will get tableViewModel and use addEntityToCache

        // explorer.addTableEntityPane.tableViewModel.addEntityToCache(newEntity).then(() => {
        //   if (!tryInsertNewHeaders(explorer.addTableEntityPane.tableViewModel, newEntity)) {
        //     explorer.addTableEntityPane.tableViewModel.redrawTableThrottled();
        //   }
        // });
        closePanel();
      });
  };

  // [Todo: Sunil]

  // const tryInsertNewHeaders = (viewModel: TableEntityListViewModel, newEntity: Entities.ITableEntity): boolean => {
  //   let newHeaders: string[] = [];
  //   const keys = Object.keys(newEntity);
  //   keys &&
  //     keys.forEach((key: string) => {
  //       if (
  //         !_.contains(viewModel.headers, key) &&
  //         key !== TableEntityProcessor.keyProperties.attachments &&
  //         key !== TableEntityProcessor.keyProperties.etag &&
  //         key !== TableEntityProcessor.keyProperties.resourceId &&
  //         key !== TableEntityProcessor.keyProperties.self &&
  //         (!viewModel.queryTablesTab.container.isPreferredApiCassandra() ||
  //           key !== TableConstants.EntityKeyNames.RowKey)
  //       ) {
  //         newHeaders.push(key);
  //       }
  //     });

  //   let newHeadersInserted = false;
  //   if (newHeaders.length) {
  //     if (!DataTableUtilities.checkForDefaultHeader(viewModel.headers)) {
  //       newHeaders = viewModel.headers.concat(newHeaders);
  //     }
  //     viewModel.updateHeaders(newHeaders, /* notifyColumnChanges */ true, /* enablePrompt */ false);
  //     newHeadersInserted = true;
  //   }
  //   return newHeadersInserted;
  // };

  // Add new entity row
  const addNewEntity = (): void => {
    const cloneEntities = [...entities];
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
    indexOfEntity: number
  ): void => {
    const entityValuePlaceholder = getEntityValuePlaceholder(selectedType.key);
    const cloneEntities = [...entities];
    cloneEntities[indexOfEntity].type = selectedType.key.toString();
    cloneEntities[indexOfEntity].entityValuePlaceholder = entityValuePlaceholder;
    cloneEntities[indexOfEntity].isEntityTypeDate = selectedType.key === "DateTime";
    setEntities(cloneEntities);
  };

  // Open edit entity value modal
  const editEntity = (rowEndex: number): void => {
    setSelectedRow(rowEndex);
    setIsEntityValuePanelTrue();
  };

  const renderPanelContent = (): JSX.Element => {
    return (
      <form className="panelFormWrapper">
        <div className="panelFormWrapper">
          <div className="panelMainContent">
            {entities.map((entity, index) => {
              return (
                <TableEntity
                  key={"" + entity.id + index}
                  isDeleteOptionVisible={entity.isDeleteOptionVisible}
                  entityTypeLabel={index === 0 && dataTypeLabel}
                  entityPropertyLabel={index === 0 && attributeNameLabel}
                  entityValueLabel={index === 0 && attributeValueLabel}
                  options={options}
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
            <Stack horizontal onClick={addNewEntity} className="addButtonEntiy">
              <Image {...imageProps} src={AddPropertyIcon} alt="Add Entity" />
              <Text className="addNewParamStyle">{addButtonLabel}</Text>
            </Stack>
          </div>
          {renderPanelFooter()}
        </div>
      </form>
    );
  };

  const renderPanelFooter = (): JSX.Element => {
    return (
      <div className="paneFooter">
        <div className="leftpanel-okbut">
          <input type="submit" onClick={submit} className="genericPaneSubmitBtn" value="Add Entity" />
        </div>
      </div>
    );
  };

  const onRenderNavigationContent: IRenderFunction<IPanelProps> = React.useCallback(
    () => (
      <Stack horizontal {...columnProps}>
        <Image {...backImageProps} src={RevertBackIcon} alt="back" onClick={() => setIsEntityValuePanelFalse()} />
        <Label>PartitionKey</Label>
      </Stack>
    ),
    []
  );

  if (isEntityValuePanelOpen) {
    return (
      <PanelContainerComponent
        headerText=""
        onRenderNavigationContent={onRenderNavigationContent}
        panelWidth="700px"
        isOpen={true}
        panelContent={
          <TextField
            multiline
            rows={5}
            className="entityValueTextField"
            onChange={(event, newInput?: string) => {
              entityChange(newInput, selectedRow, "value");
            }}
          />
        }
        closePanel={() => closePanel()}
        isConsoleExpanded={false}
      />
    );
  }

  return (
    <PanelContainerComponent
      headerText="Add Table Entity"
      panelWidth="700px"
      isOpen={true}
      panelContent={renderPanelContent()}
      closePanel={() => closePanel()}
      isConsoleExpanded={false}
    />
  );
};
