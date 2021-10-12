import * as Utilities from "../Utilities";
import QueryClauseViewModel from "./QueryClauseViewModel";

export default class ClauseGroup {
  public isRootGroup: boolean;
  //eslint-disable-next-line
  public children = new Array();
  public parentGroup: ClauseGroup;
  private _id: string;

  constructor(isRootGroup: boolean, parentGroup: ClauseGroup, id?: string) {
    this.isRootGroup = isRootGroup;
    this.parentGroup = parentGroup;
    this._id = id ? id : Utilities.guid();
  }

  /**
   * Flattens the clause tree into an array, depth-first, left to right.
   */
  public flattenClauses(targetArray: ko.ObservableArray<QueryClauseViewModel>): void {
    const tempArray = new Array<QueryClauseViewModel>();

    this.flattenClausesImpl(this, tempArray);
    targetArray.removeAll();
    tempArray.forEach((element) => {
      targetArray.push(element);
    });
  }

  public insertClauseBefore(newClause: QueryClauseViewModel, insertBefore?: QueryClauseViewModel): void {
    if (!insertBefore) {
      newClause.clauseGroup = this;
      this.children.push(newClause);
    } else {
      const targetGroup = insertBefore.clauseGroup;

      if (targetGroup) {
        const insertBeforeIndex = targetGroup.children.indexOf(insertBefore);
        newClause.clauseGroup = targetGroup;
        targetGroup.children.splice(insertBeforeIndex, 0, newClause);
      }
    }
  }

  public deleteClause(clause: QueryClauseViewModel): void {
    const targetGroup = clause.clauseGroup;

    if (targetGroup) {
      const index = targetGroup.children.indexOf(clause);
      targetGroup.children.splice(index, 1);
      clause.dispose();

      if (targetGroup.children.length <= 1 && !targetGroup.isRootGroup) {
        const parent = targetGroup.parentGroup;
        const targetGroupIndex = parent.children.indexOf(targetGroup);

        if (targetGroup.children.length === 1) {
          const orphan = targetGroup.children.shift();

          if (orphan instanceof QueryClauseViewModel) {
            (<QueryClauseViewModel>orphan).clauseGroup = parent;
          } else if (orphan instanceof ClauseGroup) {
            (<ClauseGroup>orphan).parentGroup = parent;
          }

          parent.children.splice(targetGroupIndex, 1, orphan);
        } else {
          parent.children.splice(targetGroupIndex, 1);
        }
      }
    }
  }

  public removeAll(): void {
    const allClauses: QueryClauseViewModel[] = new Array<QueryClauseViewModel>();

    this.flattenClausesImpl(this, allClauses);

    while (allClauses.length > 0) {
      allClauses.shift().dispose();
    }
    //eslint-disable-next-line
    this.children = new Array<any>();
  }

  /**
   * Groups selected items. Returns True if a new group was created, otherwise False.
   */
  public groupSelectedItems(): boolean {
    // Find the selection start & end, also check for gaps between selected items (if found, cannot proceed).
    const selection = this.getCheckedItemsInfo();

    if (selection.canGroup) {
      const newGroup = new ClauseGroup(false, this);
      // Replace the selected items with the new group, and then move the selected items into the new group.
      const groupedItems = this.children.splice(selection.begin, selection.end - selection.begin + 1, newGroup);

      groupedItems &&
        groupedItems.forEach((element) => {
          newGroup.children.push(element);

          if (element instanceof QueryClauseViewModel) {
            (<QueryClauseViewModel>element).clauseGroup = newGroup;
          } else if (element instanceof ClauseGroup) {
            (<ClauseGroup>element).parentGroup = newGroup;
          }
        });

      this.unselectAll();

      return true;
    }

    return false;
  }

  public ungroup(): void {
    if (this.isRootGroup) {
      return;
    }

    const parentGroup = this.parentGroup;
    let index = parentGroup.children.indexOf(this);

    if (index >= 0) {
      parentGroup.children.splice(index, 1);

      const toPromote = this.children.splice(0, this.children.length);

      // Move all children one level up.
      toPromote &&
        toPromote.forEach((element) => {
          if (element instanceof ClauseGroup) {
            (<ClauseGroup>element).parentGroup = parentGroup;
          } else if (element instanceof QueryClauseViewModel) {
            (<QueryClauseViewModel>element).clauseGroup = parentGroup;
          }

          parentGroup.children.splice(index, 0, element);
          index++;
        });
    }
  }

  public canGroupSelectedItems(): boolean {
    return this.getCheckedItemsInfo().canGroup;
  }

  public findDeepestGroupInChildren(skipIndex?: number): ClauseGroup {
    let deepest = <ClauseGroup>this;
    let level = 0;
    const func = (currentGroup: ClauseGroup): void => {
      level++;
      if (currentGroup.getCurrentGroupDepth() > deepest.getCurrentGroupDepth()) {
        deepest = currentGroup;
      }

      for (let i = 0; i < currentGroup.children.length; i++) {
        const currentItem = currentGroup.children[i];

        if ((i !== skipIndex || level > 1) && currentItem instanceof ClauseGroup) {
          func(currentItem);
        }
      }
      level--;
    };

    func(this);

    return deepest;
  }

  private getCheckedItemsInfo(): { canGroup: boolean; begin: number; end: number } {
    let beginIndex = -1;
    let endIndex = -1;
    // In order to perform group, all selected items must be next to each other.
    // If one or more items are not selected between the first and the last selected item, the gapFlag will be set to True, meaning cannot perform group.
    let gapFlag = false;
    let count = 0;

    for (let i = 0; i < this.children.length; i++) {
      const currentItem = this.children[i];
      let subGroupSelectionState: { allSelected: boolean; partiallySelected: boolean; nonSelected: boolean };

      if (currentItem instanceof ClauseGroup) {
        subGroupSelectionState = (<ClauseGroup>currentItem).getSelectionState();

        if (subGroupSelectionState.partiallySelected) {
          gapFlag = true;
          break;
        }
      }

      if (
        beginIndex < 0 &&
        endIndex < 0 &&
        ((currentItem instanceof QueryClauseViewModel && currentItem.checkedForGrouping.peek()) ||
          (currentItem instanceof ClauseGroup && subGroupSelectionState.allSelected))
      ) {
        beginIndex = i;
      }

      if (
        beginIndex >= 0 &&
        endIndex < 0 &&
        ((currentItem instanceof QueryClauseViewModel && !currentItem.checkedForGrouping.peek()) ||
          (currentItem instanceof ClauseGroup && !subGroupSelectionState.allSelected))
      ) {
        endIndex = i - 1;
      }

      if (beginIndex >= 0 && endIndex < 0) {
        count++;
      }

      if (
        beginIndex >= 0 &&
        endIndex >= 0 &&
        ((currentItem instanceof QueryClauseViewModel && currentItem.checkedForGrouping.peek()) ||
          (currentItem instanceof ClauseGroup && !subGroupSelectionState.nonSelected))
      ) {
        gapFlag = true;
        break;
      }
    }

    if (!gapFlag && endIndex < 0) {
      endIndex = this.children.length - 1;
    }

    return {
      canGroup: beginIndex >= 0 && !gapFlag && count > 1,
      begin: beginIndex,
      end: endIndex,
    };
  }

  private getSelectionState(): { allSelected: boolean; partiallySelected: boolean; nonSelected: boolean } {
    let selectedCount = 0;

    for (let i = 0; i < this.children.length; i++) {
      const currentItem = this.children[i];

      if (currentItem instanceof ClauseGroup && (<ClauseGroup>currentItem).getSelectionState().allSelected) {
        selectedCount++;
      }

      if (
        currentItem instanceof QueryClauseViewModel &&
        (<QueryClauseViewModel>currentItem).checkedForGrouping.peek()
      ) {
        selectedCount++;
      }
    }

    return {
      allSelected: selectedCount === this.children.length,
      partiallySelected: selectedCount > 0 && selectedCount < this.children.length,
      nonSelected: selectedCount === 0,
    };
  }

  private unselectAll(): void {
    for (let i = 0; i < this.children.length; i++) {
      const currentItem = this.children[i];

      if (currentItem instanceof ClauseGroup) {
        (<ClauseGroup>currentItem).unselectAll();
      }

      if (currentItem instanceof QueryClauseViewModel) {
        (<QueryClauseViewModel>currentItem).checkedForGrouping(false);
      }
    }
  }

  private flattenClausesImpl(queryGroup: ClauseGroup, targetArray: QueryClauseViewModel[]): void {
    if (queryGroup.isRootGroup) {
      targetArray.splice(0, targetArray.length);
    }

    for (let i = 0; i < queryGroup.children.length; i++) {
      const currentItem = queryGroup.children[i];

      if (currentItem instanceof ClauseGroup) {
        this.flattenClausesImpl(currentItem, targetArray);
      }

      if (currentItem instanceof QueryClauseViewModel) {
        targetArray.push(currentItem);
      }
    }
  }

  public getTreeDepth(): number {
    let currentDepth = this.getCurrentGroupDepth();

    for (let i = 0; i < this.children.length; i++) {
      const currentItem = this.children[i];

      if (currentItem instanceof ClauseGroup) {
        const newDepth = (<ClauseGroup>currentItem).getTreeDepth();

        if (newDepth > currentDepth) {
          currentDepth = newDepth;
        }
      }
    }

    return currentDepth;
  }

  public getCurrentGroupDepth(): number {
    let group = <ClauseGroup>this;
    let depth = 0;

    while (!group.isRootGroup) {
      depth++;
      group = group.parentGroup;
    }

    return depth;
  }

  public getId(): string {
    return this._id;
  }
}
