import * as ko from "knockout";
import * as _ from "underscore";
import * as ViewModels from "../../../Contracts/ViewModels";
import { userContext } from "../../../UserContext";
import * as TableConstants from "../../Tables/Constants";
import * as DataTableUtilities from "../../Tables/DataTable/DataTableUtilities";
import * as Entities from "../../Tables/Entities";
import { CassandraAPIDataClient, CassandraTableKey } from "../../Tables/TableDataClient";
import * as Utilities from "../../Tables/Utilities";
import EntityPropertyViewModel from "./EntityPropertyViewModel";
import TableEntityPane from "./TableEntityPane";

export default class AddTableEntityPane extends TableEntityPane {
  private static _excludedFields: string[] = [TableConstants.EntityKeyNames.Timestamp];

  private static _readonlyFields: string[] = [
    TableConstants.EntityKeyNames.PartitionKey,
    TableConstants.EntityKeyNames.RowKey,
    TableConstants.EntityKeyNames.Timestamp,
  ];

  public enterRequiredValueLabel = "Enter identifier value."; // localize
  public enterValueLabel = "Enter value to keep property."; // localize

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.submitButtonText("Add Entity");
    this.container.isPreferredApiCassandra.subscribe((isCassandra) => {
      if (isCassandra) {
        this.submitButtonText("Add Row");
      }
    });
    this.scrollId = ko.observable<string>("addEntityScroll");
  }

  public submit() {
    if (!this.canApply()) {
      return;
    }
    let entity: Entities.ITableEntity = this.entityFromAttributes(this.displayedAttributes());
    this.container.tableDataClient
      .createDocument(this.tableViewModel.queryTablesTab.collection, entity)
      .then((newEntity: Entities.ITableEntity) => {
        this.tableViewModel.addEntityToCache(newEntity).then(() => {
          if (!this.tryInsertNewHeaders(this.tableViewModel, newEntity)) {
            this.tableViewModel.redrawTableThrottled();
          }
        });
        this.close();
      });
  }

  public open() {
    var headers = this.tableViewModel.headers;
    if (DataTableUtilities.checkForDefaultHeader(headers)) {
      headers = [];
      if (userContext.apiType === "Tables") {
        headers = [TableConstants.EntityKeyNames.PartitionKey, TableConstants.EntityKeyNames.RowKey];
      }
    }
    if (this.container.isPreferredApiCassandra()) {
      (<CassandraAPIDataClient>this.container.tableDataClient)
        .getTableSchema(this.tableViewModel.queryTablesTab.collection)
        .then((columns: CassandraTableKey[]) => {
          this.displayedAttributes(
            this.constructDisplayedAttributes(
              columns.map((col) => col.property),
              Utilities.getDataTypesFromCassandraSchema(columns)
            )
          );
          this.updateIsActionEnabled();
          super.open();
          this.focusValueElement();
        });
    } else {
      this.displayedAttributes(
        this.constructDisplayedAttributes(
          headers,
          Utilities.getDataTypesFromEntities(headers, this.tableViewModel.items())
        )
      );
      this.updateIsActionEnabled();
      super.open();
      this.focusValueElement();
    }
  }

  private focusValueElement() {
    const focusElement = document.getElementById("addTableEntityValue");
    focusElement && focusElement.focus();
  }

  private constructDisplayedAttributes(headers: string[], dataTypes: any): EntityPropertyViewModel[] {
    var displayedAttributes: EntityPropertyViewModel[] = [];
    headers &&
      headers.forEach((key: string) => {
        if (!_.contains<string>(AddTableEntityPane._excludedFields, key)) {
          if (this.container.isPreferredApiCassandra()) {
            const cassandraKeys = this.tableViewModel.queryTablesTab.collection.cassandraKeys.partitionKeys
              .concat(this.tableViewModel.queryTablesTab.collection.cassandraKeys.clusteringKeys)
              .map((key) => key.property);
            var isRequired: boolean = _.contains<string>(cassandraKeys, key);
            var editable: boolean = false;
            var placeholderLabel: string = isRequired ? this.enterRequiredValueLabel : this.enterValueLabel;
            var entityAttributeType: string = dataTypes[key] || TableConstants.CassandraType.Text; // Default to String if there is no type specified.
            // TODO figure out validation story for blob and Inet so we can allow adding/editing them
            const nonEditableType: boolean =
              entityAttributeType === TableConstants.CassandraType.Blob ||
              entityAttributeType === TableConstants.CassandraType.Inet;
            var entity: EntityPropertyViewModel = new EntityPropertyViewModel(
              this,
              key,
              entityAttributeType,
              "", // default to empty string
              /* namePlaceholder */ undefined,
              nonEditableType ? "Type is not editable via DataExplorer." : placeholderLabel,
              editable,
              /* default valid name */ true,
              /* default valid value */ true,
              /* required value */ isRequired,
              /* removable */ false,
              /* valueEditable */ !nonEditableType,
              /* ignoreEmptyValue */ true
            );
          } else {
            var isRequired: boolean = _.contains<string>(AddTableEntityPane.requiredFieldsForTablesAPI, key);
            var editable: boolean = !_.contains<string>(AddTableEntityPane._readonlyFields, key);
            var placeholderLabel: string = isRequired ? this.enterRequiredValueLabel : this.enterValueLabel;
            var entityAttributeType: string = dataTypes[key] || TableConstants.TableType.String; // Default to String if there is no type specified.
            var entity: EntityPropertyViewModel = new EntityPropertyViewModel(
              this,
              key,
              entityAttributeType,
              "", // default to empty string
              /* namePlaceholder */ undefined,
              placeholderLabel,
              editable,
              /* default valid name */ true,
              /* default valid value */ true,
              /* required value */ isRequired,
              /* removable */ editable,
              /* valueEditable */ true,
              /* ignoreEmptyValue */ true
            );
          }
          displayedAttributes.push(entity);
        }
      });

    return displayedAttributes;
  }
}
