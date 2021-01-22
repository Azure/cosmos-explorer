import * as ko from "knockout";
import _ from "underscore";
import * as DataTableUtilities from "../../Tables/DataTable/DataTableUtilities";
import * as Entities from "../../Tables/Entities";
import EntityPropertyViewModel from "./EntityPropertyViewModel";
import * as TableConstants from "../../Tables/Constants";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import * as TableEntityProcessor from "../../Tables/TableEntityProcessor";
import * as Utilities from "../../Tables/Utilities";
import * as ViewModels from "../../../Contracts/ViewModels";
import { KeyCodes } from "../../../Common/Constants";
import { ContextualPaneBase } from "../ContextualPaneBase";

// Class with variables and functions that are common to both adding and editing entities
export default abstract class TableEntityPane extends ContextualPaneBase {
  protected static requiredFieldsForTablesAPI: string[] = [
    TableConstants.EntityKeyNames.PartitionKey,
    TableConstants.EntityKeyNames.RowKey,
  ];

  /* Labels */
  public attributeNameLabel = "Property Name"; // localize
  public dataTypeLabel = "Type"; // localize
  public attributeValueLabel = "Value"; // localize

  /* Controls */
  public removeButtonLabel = "Remove"; // localize
  public editButtonLabel = "Edit"; // localize
  public addButtonLabel = "Add Property"; // localize

  public edmTypes: ko.ObservableArray<string> = ko.observableArray([
    TableConstants.TableType.String,
    TableConstants.TableType.Boolean,
    TableConstants.TableType.Binary,
    TableConstants.TableType.DateTime,
    TableConstants.TableType.Double,
    TableConstants.TableType.Guid,
    TableConstants.TableType.Int32,
    TableConstants.TableType.Int64,
  ]);

  public canAdd: ko.Computed<boolean>;
  public canApply: ko.Observable<boolean>;
  public displayedAttributes = ko.observableArray<EntityPropertyViewModel>();
  public editingProperty = ko.observable<EntityPropertyViewModel>();
  public isEditing = ko.observable<boolean>(false);
  public submitButtonText = ko.observable<string>();

  public tableViewModel: TableEntityListViewModel;

  protected scrollId: ko.Observable<string>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.container.isPreferredApiCassandra.subscribe((isCassandra) => {
      if (isCassandra) {
        this.edmTypes([
          TableConstants.CassandraType.Text,
          TableConstants.CassandraType.Ascii,
          TableConstants.CassandraType.Bigint,
          TableConstants.CassandraType.Blob,
          TableConstants.CassandraType.Boolean,
          TableConstants.CassandraType.Decimal,
          TableConstants.CassandraType.Double,
          TableConstants.CassandraType.Float,
          TableConstants.CassandraType.Int,
          TableConstants.CassandraType.Uuid,
          TableConstants.CassandraType.Varchar,
          TableConstants.CassandraType.Varint,
          TableConstants.CassandraType.Inet,
          TableConstants.CassandraType.Smallint,
          TableConstants.CassandraType.Tinyint,
        ]);
      }
    });

    this.canAdd = ko.computed<boolean>(() => {
      // Cassandra can't add since the schema can't be changed once created
      if (this.container.isPreferredApiCassandra()) {
        return false;
      }
      // Adding '2' to the maximum to take into account PartitionKey and RowKey
      return this.displayedAttributes().length < EntityPropertyViewModel.maximumNumberOfProperties + 2;
    });
    this.canApply = ko.observable<boolean>(true);
    this.editingProperty(this.displayedAttributes()[0]);
  }

  public removeAttribute = (index: number, data: any): void => {
    this.displayedAttributes.splice(index, 1);
    this.updateIsActionEnabled();
    document.getElementById("addProperty").focus();
  };

  public editAttribute = (index: number, data: EntityPropertyViewModel): void => {
    this.editingProperty(data);
    this.isEditing(true);
    document.getElementById("textAreaEditProperty").focus();
  };

  public finishEditingAttribute = (): void => {
    this.isEditing(false);
    this.editingProperty(null);
  };

  public onKeyUp = (data: any, event: KeyboardEvent): boolean => {
    var handled: boolean = Utilities.onEsc(event, ($sourceElement: JQuery) => {
      this.finishEditingAttribute();
    });

    return !handled;
  };

  public onAddPropertyKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.insertAttribute();
      event.stopPropagation();
      return false;
    }

    return true;
  };

  public onEditPropertyKeyDown = (
    index: number,
    data: EntityPropertyViewModel,
    event: KeyboardEvent,
    source: any
  ): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.editAttribute(index, data);
      event.stopPropagation();
      return false;
    }

    return true;
  };

  public onDeletePropertyKeyDown = (
    index: number,
    data: EntityPropertyViewModel,
    event: KeyboardEvent,
    source: any
  ): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.removeAttribute(index, data);
      event.stopPropagation();
      return false;
    }

    return true;
  };

  public onBackButtonKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.finishEditingAttribute();
      event.stopPropagation();
      return false;
    }

    return true;
  };

  public insertAttribute = (name?: string, type?: string): void => {
    let entityProperty: EntityPropertyViewModel;
    if (!!name && !!type && this.container.isPreferredApiCassandra()) {
      // TODO figure out validation story for blob and Inet so we can allow adding/editing them
      const nonEditableType: boolean =
        type === TableConstants.CassandraType.Blob || type === TableConstants.CassandraType.Inet;
      entityProperty = new EntityPropertyViewModel(
        this,
        name,
        type,
        "", // default to empty string
        /* namePlaceholder */ undefined,
        /* valuePlaceholder */ undefined,
        /* editable */ false,
        /* default valid name */ false,
        /* default valid value */ true,
        /* isRequired */ false,
        /* removable */ false,
        /*value editable*/ !nonEditableType
      );
    } else {
      entityProperty = new EntityPropertyViewModel(
        this,
        "",
        this.edmTypes()[0], // default to the first Edm type: 'string'
        "", // default to empty string
        /* namePlaceholder */ undefined,
        /* valuePlaceholder */ undefined,
        /* editable */ true,
        /* default valid name */ false,
        /* default valid value */ true
      );
    }

    this.displayedAttributes.push(entityProperty);
    this.updateIsActionEnabled();
    this.scrollToBottom();

    entityProperty.hasFocus(true);
  };

  public updateIsActionEnabled(needRequiredFields: boolean = true): void {
    var properties: EntityPropertyViewModel[] = this.displayedAttributes() || [];
    var disable: boolean = _.some(properties, (property: EntityPropertyViewModel) => {
      return property.isInvalidName() || property.isInvalidValue();
    });

    this.canApply(!disable);
  }

  protected entityFromAttributes(displayedAttributes: EntityPropertyViewModel[]): Entities.ITableEntity {
    var entity: any = {};

    displayedAttributes &&
      displayedAttributes.forEach((attribute: EntityPropertyViewModel) => {
        if (attribute.name() && (attribute.value() !== "" || attribute.isRequired)) {
          var value = attribute.getPropertyValue();
          var type = attribute.type();
          if (type === TableConstants.TableType.Int64) {
            value = Utilities.padLongWithZeros(value);
          }
          entity[attribute.name()] = {
            _: value,
            $: type,
          };
        }
      });

    return entity;
  }

  // Removing Binary from Add Entity dialog until we have a full story for it.
  protected setOptionDisable(option: Node, value: string): void {
    ko.applyBindingsToNode(option, { disable: value === TableConstants.TableType.Binary }, value);
  }

  /**
   * Parse the updated entity to see if there are any new attributes that old headers don't have.
   * In this case, add these attributes names as new headers.
   * Remarks: adding new headers will automatically trigger table redraw.
   */
  protected tryInsertNewHeaders(viewModel: TableEntityListViewModel, newEntity: Entities.ITableEntity): boolean {
    var newHeaders: string[] = [];
    const keys = Object.keys(newEntity);
    keys &&
      keys.forEach((key: string) => {
        if (
          !_.contains(viewModel.headers, key) &&
          key !== TableEntityProcessor.keyProperties.attachments &&
          key !== TableEntityProcessor.keyProperties.etag &&
          key !== TableEntityProcessor.keyProperties.resourceId &&
          key !== TableEntityProcessor.keyProperties.self &&
          (!viewModel.queryTablesTab.container.isPreferredApiCassandra() ||
            key !== TableConstants.EntityKeyNames.RowKey)
        ) {
          newHeaders.push(key);
        }
      });

    var newHeadersInserted: boolean = false;
    if (newHeaders.length) {
      if (!DataTableUtilities.checkForDefaultHeader(viewModel.headers)) {
        newHeaders = viewModel.headers.concat(newHeaders);
      }
      viewModel.updateHeaders(newHeaders, /* notifyColumnChanges */ true, /* enablePrompt */ false);
      newHeadersInserted = true;
    }
    return newHeadersInserted;
  }

  protected scrollToBottom(): void {
    var scrollBox = document.getElementById(this.scrollId());
    var isScrolledToBottom = scrollBox.scrollHeight - scrollBox.clientHeight <= scrollBox.scrollHeight + 1;
    if (isScrolledToBottom) {
      scrollBox.scrollTop = scrollBox.scrollHeight - scrollBox.clientHeight;
    }
  }
}
