import * as ko from "knockout";
import * as _ from "underscore";

enum ScrollPosition {
  Top,
  Bottom,
}

export class AccessibleVerticalList {
  private items: unknown[] = [];
  private onSelect?: (item: unknown) => void;

  public currentItemIndex: ko.Observable<number>;
  public currentItem: ko.Computed<unknown>;

  constructor(initialSetOfItems: unknown[]) {
    this.items = initialSetOfItems;
    this.currentItemIndex = this.items !== undefined && this.items.length > 0 ? ko.observable(0) : ko.observable(-1);
    this.currentItem = ko.computed<unknown>(() => this.items[this.currentItemIndex()]);
  }

  public setOnSelect(onSelect: (item: unknown) => void): void {
    this.onSelect = onSelect;
  }

  public onKeyDown = (_src: unknown, event: KeyboardEvent): boolean => {
    const targetContainer: Element = <Element>event.target;
    if (this.items === undefined || this.items.length === 0) {
      // no items so this should be a noop
      return true;
    }
    if (event.keyCode === 32 || event.keyCode === 13) {
      // on space or enter keydown
      this.onSelect && this.onSelect(this.currentItem());
      event.stopPropagation();
      return false;
    }
    if (event.keyCode === 38) {
      // on UpArrow keydown
      event.preventDefault();
      this.selectPreviousItem();
      const targetElement = targetContainer
        .getElementsByClassName("accessibleListElement")
        .item(this.currentItemIndex());
      if (targetElement) {
        this.scrollElementIntoContainerViewIfNeeded(targetElement, targetContainer, ScrollPosition.Top);
      }
      return false;
    }
    if (event.keyCode === 40) {
      // on DownArrow keydown
      event.preventDefault();
      this.selectNextItem();
      const targetElement = targetContainer
        .getElementsByClassName("accessibleListElement")
        .item(this.currentItemIndex());
      if (targetElement) {
        this.scrollElementIntoContainerViewIfNeeded(targetElement, targetContainer, ScrollPosition.Top);
      }
      return false;
    }
    return true;
  };

  public updateItemList(newItemList: unknown[]): void {
    if (newItemList === undefined || newItemList.length === 0) {
      this.currentItemIndex(-1);
      this.items = [];
      return;
    } else if (this.currentItemIndex() < 0) {
      this.currentItemIndex(0);
    }
    this.items = newItemList;
  }

  public updateCurrentItem(item: unknown): void {
    const updatedIndex: number = this.isItemListEmpty() ? -1 : _.indexOf(this.items, item);
    this.currentItemIndex(updatedIndex);
  }

  private isElementVisibleInContainer(element: Element, container: Element): boolean {
    const elementTop = element.getBoundingClientRect().top;
    const elementBottom = element.getBoundingClientRect().bottom;
    const containerTop = container.getBoundingClientRect().top;
    const containerBottom = container.getBoundingClientRect().bottom;

    return elementTop >= containerTop && elementBottom <= containerBottom;
  }

  private scrollElementIntoContainerViewIfNeeded(
    element: Element,
    container: Element,
    scrollPosition: ScrollPosition
  ): void {
    if (!this.isElementVisibleInContainer(element, container)) {
      if (scrollPosition === ScrollPosition.Top) {
        container.scrollTop =
          element.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      } else {
        container.scrollTop =
          element.getBoundingClientRect().bottom - element.getBoundingClientRect().top + container.scrollTop;
      }
    }
  }

  private selectPreviousItem(): void {
    if (this.currentItemIndex() <= 0 || this.isItemListEmpty()) {
      return;
    }
    this.currentItemIndex(this.currentItemIndex() - 1);
  }

  private selectNextItem(): void {
    if (this.isItemListEmpty() || this.currentItemIndex() === this.items.length - 1) {
      return;
    }
    this.currentItemIndex(this.currentItemIndex() + 1);
  }

  private isItemListEmpty(): boolean {
    return this.items === undefined || this.items.length === 0;
  }
}
