import * as ko from "knockout";
import * as Constants from "../Constants";
import ClauseGroup from "./ClauseGroup";
import QueryBuilderViewModel from "./QueryBuilderViewModel";

/**
 * View model for showing group indicators on UI, contains information such as group color and border styles.
 */
export default class ClauseGroupViewModel {
  public ungroupClausesLabel = "Ungroup clauses"; // localize

  public backgroundColor: ko.Observable<string>;
  public canUngroup: ko.Observable<boolean>;
  public showTopBorder: ko.Observable<boolean>;
  public showLeftBorder: ko.Observable<boolean>;
  public showBottomBorder: ko.Observable<boolean>;
  public depth: ko.Observable<number>; // for debugging purpose only, now showing the number on UI.
  public borderBackgroundColor: ko.Observable<string>;

  private _clauseGroup: ClauseGroup;
  private _queryBuilderViewModel: QueryBuilderViewModel;

  constructor(clauseGroup: ClauseGroup, canUngroup: boolean, queryBuilderViewModel: QueryBuilderViewModel) {
    this._clauseGroup = clauseGroup;
    this._queryBuilderViewModel = queryBuilderViewModel;
    this.backgroundColor = ko.observable<string>(this.getGroupBackgroundColor(clauseGroup));
    this.canUngroup = ko.observable<boolean>(canUngroup);
    this.showTopBorder = ko.observable<boolean>(false);
    this.showLeftBorder = ko.observable<boolean>(false);
    this.showBottomBorder = ko.observable<boolean>(false);
    this.depth = ko.observable<number>(clauseGroup.getCurrentGroupDepth());
    this.borderBackgroundColor = ko.observable<string>("solid thin " + this.getGroupBackgroundColor(clauseGroup));
  }

  public ungroupClauses = (): void => {
    this._clauseGroup.ungroup();
    this._queryBuilderViewModel.updateClauseArray();
  };

  private getGroupBackgroundColor(group: ClauseGroup): string {
    var colorCount = Constants.clauseGroupColors.length;

    if (group.isRootGroup) {
      return Constants.transparentColor;
    } else {
      return Constants.clauseGroupColors[group.getCurrentGroupDepth() % colorCount];
    }
  }
}
