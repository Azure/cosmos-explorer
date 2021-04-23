import * as ko from "knockout";
import _ from "underscore";
import * as ViewModels from "../../../Contracts/ViewModels";
import { userContext } from "../../../UserContext";
import Explorer from "../../Explorer";
import * as TableConstants from "../../Tables/Constants";
import * as Entities from "../../Tables/Entities";
import { CassandraAPIDataClient, CassandraTableKey } from "../../Tables/TableDataClient";
import * as TableEntityProcessor from "../../Tables/TableEntityProcessor";
import * as Utilities from "../../Tables/Utilities";
import EntityPropertyViewModel from "./EntityPropertyViewModel";
import TableEntityPane from "./TableEntityPane";

export default class EditTableEntityPane extends TableEntityPane {
  container: Explorer;
  visible: ko.Observable<boolean>;

  public originEntity: Entities.ITableEntity;
  public originalNumberOfProperties: number;
  private originalDocument: any;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.submitButtonText("Update Entity");
    if (userContext.apiType === "Cassandra") {
      this.submitButtonText("Update Row");
    }
    this.scrollId = ko.observable<string>("editEntityScroll");
  }

  public submit() {
    if (!this.canApply()) {
      return;
    }
    let entity: Entities.ITableEntity = this.updateEntity(this.displayedAttributes());
    this.container.tableDataClient
      .updateDocument(this.tableViewModel.queryTablesTab.collection, this.originalDocument, entity)
      .then((newEntity: Entities.ITableEntity) => {
        var numberOfProperties = 0;
        for (var property in newEntity) {
          if (
            property !== TableEntityProcessor.keyProperties.attachments &&
            property !== TableEntityProcessor.keyProperties.etag &&
            property !== TableEntityProcessor.keyProperties.resourceId &&
            property !== TableEntityProcessor.keyProperties.self &&
            (userContext.apiType !== "Cassandra" || property !== TableConstants.EntityKeyNames.RowKey)
          ) {
            numberOfProperties++;
          }
        }

        var propertiesDelta = numberOfProperties - this.originalNumberOfProperties;

        return this.tableViewModel
          .updateCachedEntity(newEntity)
          .then(() => {
            if (!this.tryInsertNewHeaders(this.tableViewModel, newEntity)) {
              this.tableViewModel.redrawTableThrottled();
            }
          })
          .then(() => {
            // Selecting updated entity
            this.tableViewModel.selected.removeAll();
            this.tableViewModel.selected.push(newEntity);
          });
      });
    this.close();
  }

  public open() {
    this.displayedAttributes(this.constructDisplayedAttributes(this.originEntity));
    if (userContext.apiType === "Tables") {
      this.originalDocument = TableEntityProcessor.convertEntitiesToDocuments(
        [<Entities.ITableEntityForTablesAPI>this.originEntity],
        this.tableViewModel.queryTablesTab.collection
      )[0]; // TODO change for Cassandra
      this.originalDocument.id = ko.observable<string>(this.originalDocument.id);
    } else {
      this.originalDocument = this.originEntity;
    }
    this.updateIsActionEnabled();
    super.open();
  }

  private constructDisplayedAttributes(entity: Entities.ITableEntity): EntityPropertyViewModel[] {
    var displayedAttributes: EntityPropertyViewModel[] = [];
    const keys = Object.keys(entity);
    keys &&
      keys.forEach((key: string) => {
        if (
          key !== TableEntityProcessor.keyProperties.attachments &&
          key !== TableEntityProcessor.keyProperties.etag &&
          key !== TableEntityProcessor.keyProperties.resourceId &&
          key !== TableEntityProcessor.keyProperties.self &&
          (userContext.apiType !== "Cassandra" || key !== TableConstants.EntityKeyNames.RowKey)
        ) {
          if (userContext.apiType === "Cassandra") {
            const cassandraKeys = this.tableViewModel.queryTablesTab.collection.cassandraKeys.partitionKeys
              .concat(this.tableViewModel.queryTablesTab.collection.cassandraKeys.clusteringKeys)
              .map((key) => key.property);
            var entityAttribute: Entities.ITableEntityAttribute = entity[key];
            var entityAttributeType: string = entityAttribute.$;
            var displayValue: any = this.getPropertyDisplayValue(entity, key, entityAttributeType);
            var removable: boolean = false;
            // TODO figure out validation story for blob and Inet so we can allow adding/editing them
            const nonEditableType: boolean =
              entityAttributeType === TableConstants.CassandraType.Blob ||
              entityAttributeType === TableConstants.CassandraType.Inet;

            displayedAttributes.push(
              new EntityPropertyViewModel(
                this,
                key,
                entityAttributeType,
                displayValue,
                /* namePlaceholder */ undefined,
                /* valuePlaceholder */ undefined,
                false,
                /* default valid name */ true,
                /* default valid value */ true,
                /* isRequired */ false,
                removable,
                /*value editable*/ !_.contains<string>(cassandraKeys, key) && !nonEditableType
              )
            );
          } else {
            var entityAttribute: Entities.ITableEntityAttribute = entity[key];
            var entityAttributeType: string = entityAttribute.$;
            var displayValue: any = this.getPropertyDisplayValue(entity, key, entityAttributeType);
            var editable: boolean = this.isAttributeEditable(key, entityAttributeType);
            // As per VSO:189935, Binary properties are read-only, we still want to be able to remove them.
            var removable: boolean = editable || entityAttributeType === TableConstants.TableType.Binary;

            displayedAttributes.push(
              new EntityPropertyViewModel(
                this,
                key,
                entityAttributeType,
                displayValue,
                /* namePlaceholder */ undefined,
                /* valuePlaceholder */ undefined,
                editable,
                /* default valid name */ true,
                /* default valid value */ true,
                /* isRequired */ false,
                removable
              )
            );
          }
        }
      });
    if (userContext.apiType === "Cassandra") {
      (<CassandraAPIDataClient>this.container.tableDataClient)
        .getTableSchema(this.tableViewModel.queryTablesTab.collection)
        .then((properties: CassandraTableKey[]) => {
          properties &&
            properties.forEach((property) => {
              if (!_.contains(keys, property.property)) {
                this.insertAttribute(property.property, property.type);
              }
            });
        });
    }
    return displayedAttributes;
  }

  private updateEntity(displayedAttributes: EntityPropertyViewModel[]): Entities.ITableEntity {
    var updatedEntity: any = {};
    displayedAttributes &&
      displayedAttributes.forEach((attribute: EntityPropertyViewModel) => {
        if (attribute.name() && (userContext.apiType !== "Cassandra" || attribute.value() !== "")) {
          var value = attribute.getPropertyValue();
          var type = attribute.type();
          if (type === TableConstants.TableType.Int64) {
            value = Utilities.padLongWithZeros(value);
          }
          updatedEntity[attribute.name()] = {
            _: value,
            $: type,
          };
        }
      });
    return updatedEntity;
  }

  private isAttributeEditable(attributeName: string, entityAttributeType: string) {
    return !(
      attributeName === TableConstants.EntityKeyNames.PartitionKey ||
      attributeName === TableConstants.EntityKeyNames.RowKey ||
      attributeName === TableConstants.EntityKeyNames.Timestamp ||
      // As per VSO:189935, Making Binary properties read-only in Edit Entity dialog until we have a full story for it.
      entityAttributeType === TableConstants.TableType.Binary
    );
  }

  private getPropertyDisplayValue(entity: Entities.ITableEntity, name: string, type: string): any {
    var attribute: Entities.ITableEntityAttribute = entity[name];
    var displayValue: any = attribute._;
    var isBinary: boolean = type === TableConstants.TableType.Binary;

    // Showing the value in base64 for binary properties since that is what the Azure Storage Client Library expects.
    // This means that, even if the Azure Storage API returns a byte[] of binary content, it needs that same array
    // *base64 - encoded * as the value for the updated property or the whole update operation will fail.
    if (isBinary && displayValue && $.isArray(displayValue.data)) {
      var bytes: number[] = displayValue.data;
      displayValue = this.getBase64DisplayValue(bytes);
    }

    return displayValue;
  }

  private getBase64DisplayValue(bytes: number[]): string {
    var displayValue: string = null;

    try {
      var chars: string[] = bytes.map((byte: number) => String.fromCharCode(byte));
      var toEncode: string = chars.join("");
      displayValue = window.btoa(toEncode);
    } catch (error) {
      // Error
    }

    return displayValue;
  }
}
