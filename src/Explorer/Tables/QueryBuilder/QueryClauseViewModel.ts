import * as ko from "knockout";
import _ from "underscore";
import { userContext } from "../../../UserContext";
import * as QueryBuilderConstants from "../Constants";
import * as Utilities from "../Utilities";
import ClauseGroup from "./ClauseGroup";
import QueryBuilderViewModel from "./QueryBuilderViewModel";

export default class QueryClauseViewModel {
  public checkedForGrouping: ko.Observable<boolean>;
  public isFirstInGroup: ko.Observable<boolean>;
  public clauseGroup: ClauseGroup;
  public and_or: ko.Observable<string>;
  public field: ko.Observable<string>;
  public type: ko.Observable<string>;
  public operator: ko.Observable<string>;
  public value: ko.Observable<string>;
  public timeValue: ko.Observable<string>;
  public customTimeValue: ko.Observable<string>;
  public canAnd: ko.Observable<boolean>;
  public timestampType: ko.Observable<string>;
  //public customLastTimestamp: ko.Observable<CustomTimestampHelper.ILastQuery>;
  public isLocal: ko.Observable<boolean>;
  public isOperaterEditable: ko.PureComputed<boolean>;
  public isTypeEditable: ko.PureComputed<boolean>;
  public isValue: ko.Observable<boolean>;
  public isTimestamp: ko.Observable<boolean>;
  public isCustomLastTimestamp: ko.Observable<boolean>;
  public isCustomRangeTimestamp: ko.Observable<boolean>;
  private _queryBuilderViewModel: QueryBuilderViewModel;
  private _groupCheckSubscription: ko.Subscription;
  private _id: string;
  public isAndOrFocused: ko.Observable<boolean>;
  public isDeleteButtonFocused: ko.Observable<boolean>;

  constructor(
    queryBuilderViewModel: QueryBuilderViewModel,
    and_or: string,
    field: string,
    type: string,
    operator: string,
    value: string,
    canAnd: boolean,
    timeValue: string,
    customTimeValue: string,
    timestampType: string,
    //customLastTimestamp: CustomTimestampHelper.ILastQuery,
    isLocal: boolean,
    id?: string,
  ) {
    this._queryBuilderViewModel = queryBuilderViewModel;
    this.checkedForGrouping = ko.observable<boolean>(false);
    this.isFirstInGroup = ko.observable<boolean>(false);
    this.and_or = ko.observable<string>(and_or);
    this.field = ko.observable<string>(field);
    this.type = ko.observable<string>(type);
    this.operator = ko.observable<string>(operator);
    this.value = ko.observable<string>(value);
    this.timeValue = ko.observable<string>(timeValue);
    this.customTimeValue = ko.observable<string>(customTimeValue);
    this.canAnd = ko.observable<boolean>(canAnd);
    this.isLocal = ko.observable<boolean>(isLocal);
    this._id = id ? id : Utilities.guid();

    //this.customLastTimestamp = ko.observable<CustomTimestampHelper.ILastQuery>(customLastTimestamp);
    //this.setCustomLastTimestamp();

    this.timestampType = ko.observable<string>(timestampType);
    this.getValueType();

    this.isOperaterEditable = ko.pureComputed<boolean>(() => {
      const isPreferredApiCassandra = userContext.apiType === "Cassandra";
      const cassandraKeys = isPreferredApiCassandra
        ? this._queryBuilderViewModel.tableEntityListViewModel.queryTablesTab.collection.cassandraKeys.partitionKeys.map(
            (key) => key.property,
          )
        : [];
      return (
        (this.isValue() || this.isCustomRangeTimestamp()) &&
        (!isPreferredApiCassandra || !_.contains(cassandraKeys, this.field()))
      );
    });
    this.isTypeEditable = ko.pureComputed<boolean>(
      () =>
        this.field() !== "Timestamp" &&
        this.field() !== "PartitionKey" &&
        this.field() !== "RowKey" &&
        userContext.apiType !== "Cassandra",
    );

    this.and_or.subscribe(() => {
      this._queryBuilderViewModel.checkIfClauseChanged();
    });
    this.field.subscribe(() => {
      this.changeField();
    });
    this.type.subscribe(() => {
      this.changeType();
    });
    this.timeValue.subscribe(() => {
      // if (this.timeValue() === QueryBuilderConstants.timeOptions.custom) {
      //     this.customTimestampDialog();
      // }
    });
    this.customTimeValue.subscribe(() => {
      this._queryBuilderViewModel.checkIfClauseChanged();
    });
    this.value.subscribe(() => {
      this._queryBuilderViewModel.checkIfClauseChanged();
    });
    this.operator.subscribe(() => {
      this._queryBuilderViewModel.checkIfClauseChanged();
    });
    this._groupCheckSubscription = this.checkedForGrouping.subscribe(() => {
      this._queryBuilderViewModel.updateCanGroupClauses();
    });
    this.isAndOrFocused = ko.observable<boolean>(false);
    this.isDeleteButtonFocused = ko.observable<boolean>(false);
  }

  // private setCustomLastTimestamp() : void {
  //     if (this.customLastTimestamp() === null) {
  //         var lastNumberandType: CustomTimestampHelper.ILastQuery = {
  //             lastNumber: 7,
  //             lastTimeUnit: "Days"
  //     };
  //         this.customLastTimestamp(lastNumberandType);
  //     }
  // }

  private getValueType(): void {
    switch (this.timestampType()) {
      case "time":
        this.isValue = ko.observable<boolean>(false);
        this.isTimestamp = ko.observable<boolean>(true);
        this.isCustomLastTimestamp = ko.observable<boolean>(false);
        this.isCustomRangeTimestamp = ko.observable<boolean>(false);
        break;
      case "last":
        this.isValue = ko.observable<boolean>(false);
        this.isTimestamp = ko.observable<boolean>(false);
        this.isCustomLastTimestamp = ko.observable<boolean>(true);
        this.isCustomRangeTimestamp = ko.observable<boolean>(false);
        break;
      case "range":
        this.isValue = ko.observable<boolean>(false);
        this.isTimestamp = ko.observable<boolean>(false);
        this.isCustomLastTimestamp = ko.observable<boolean>(false);
        this.isCustomRangeTimestamp = ko.observable<boolean>(true);
        break;
      default:
        this.isValue = ko.observable<boolean>(true);
        this.isTimestamp = ko.observable<boolean>(false);
        this.isCustomLastTimestamp = ko.observable<boolean>(false);
        this.isCustomRangeTimestamp = ko.observable<boolean>(false);
    }
  }

  private changeField(): void {
    this.isCustomLastTimestamp(false);
    this.isCustomRangeTimestamp(false);

    if (this.field() === "Timestamp") {
      this.isValue(false);
      this.isTimestamp(true);
      this.type(QueryBuilderConstants.TableType.DateTime);
      this.operator(QueryBuilderConstants.Operator.GreaterThanOrEqualTo);
      this.timestampType("time");
    } else if (this.field() === "PartitionKey" || this.field() === "RowKey") {
      this.resetFromTimestamp();
      this.type(QueryBuilderConstants.TableType.String);
    } else {
      this.resetFromTimestamp();
      if (userContext.apiType === "Cassandra") {
        const cassandraSchema =
          this._queryBuilderViewModel.tableEntityListViewModel.queryTablesTab.collection.cassandraSchema;
        for (let i = 0, len = cassandraSchema.length; i < len; i++) {
          if (cassandraSchema[i].property === this.field()) {
            this.type(cassandraSchema[i].type);
            i = len;
          }
        }
      } else {
        this.type(QueryBuilderConstants.TableType.String);
      }
    }
    this._queryBuilderViewModel.checkIfClauseChanged();
  }

  private resetFromTimestamp(): void {
    this.isValue(true);
    this.isTimestamp(false);
    this.operator(QueryBuilderConstants.Operator.Equal);
    this.value("");
    this.timestampType("");
    this.timeValue("");
    this.customTimeValue("");
  }

  private changeType(): void {
    this.isCustomLastTimestamp(false);
    this.isCustomRangeTimestamp(false);

    if (this.type() === QueryBuilderConstants.TableType.DateTime) {
      this.isValue(false);
      this.isTimestamp(true);
      this.operator(QueryBuilderConstants.Operator.GreaterThanOrEqualTo);
      this.timestampType("time");
    } else {
      this.isValue(true);
      this.isTimestamp(false);
      this.timeValue("");
      this.operator(QueryBuilderConstants.Operator.EqualTo);
      this.value("");
      this.timestampType("");
      this.timeValue("");
      this.customTimeValue("");
    }
    this._queryBuilderViewModel.checkIfClauseChanged();
  }

  // private customTimestampDialog(): Promise<any> {
  //     var lastNumber = this.customLastTimestamp().lastNumber;
  //     var lastTimeUnit = this.customLastTimestamp().lastTimeUnit;

  //     return this._host.executeOperation("Environment.openDialog", [{
  //         id: AzureConstants.registeredDialogs.customTimestampQueryDialog,
  //         width: 500,
  //         height: 300,
  //         parameters: { lastNumber, lastTimeUnit }
  //     }]).then((timestamp: CustomTimestampHelper.ITimestampQuery) => {
  //         if (timestamp) {
  //             this.isValue(false);
  //             this.isTimestamp(false);
  //             this.timestampType(timestamp.queryType);

  //             if (timestamp.queryType === "last") {
  //                 this.isCustomLastTimestamp(true);
  //                 this.isCustomRangeTimestamp(false);

  //                 var lastNumberandType: CustomTimestampHelper.ILastQuery = {
  //                     lastNumber: timestamp.lastNumber,
  //                     lastTimeUnit: timestamp.lastTimeUnit
  //                 };

  //                 this.customLastTimestamp(lastNumberandType);
  //                 this.customTimeValue(`Last ${timestamp.lastNumber} ${timestamp.lastTimeUnit}`);

  //             } else {
  //                 if (timestamp.timeZone === "local") {
  //                     this.isLocal = ko.observable(true);
  //                 } else {
  //                     this.isLocal = ko.observable(false);
  //                 }
  //                 this.isCustomLastTimestamp(false);
  //                 this.isCustomRangeTimestamp(true);
  //                 this.customTimeValue(timestamp.startTime);
  //                 CustomTimestampHelper.addRangeTimestamp(timestamp, this._queryBuilderViewModel, this);
  //             }
  //         } else {
  //             this.timeValue(QueryBuilderConstants.timeOptions.lastHour);
  //         }
  //     });
  // }

  public getId(): string {
    return this._id;
  }

  public get groupDepth(): number {
    if (this.clauseGroup) {
      return this.clauseGroup.getCurrentGroupDepth();
    }

    return -1;
  }

  public dispose(): void {
    if (this._groupCheckSubscription) {
      this._groupCheckSubscription.dispose();
    }

    this.clauseGroup = undefined;
    this._queryBuilderViewModel = undefined;
  }
}
