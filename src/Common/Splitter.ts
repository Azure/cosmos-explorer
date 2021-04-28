import * as ko from "knockout";

import { SplitterMetrics } from "./Constants";

export enum SplitterDirection {
  Horizontal = "horizontal",
  Vertical = "vertical",
}

export interface SplitterBounds {
  max: number;
  min: number;
}

export interface SplitterOptions {
  splitterId: string;
  leftId: string;
  bounds: SplitterBounds;
  direction: SplitterDirection;
}

export class Splitter {
  public splitterId: string;
  public leftSideId: string;

  public splitter!: HTMLElement;
  public leftSide!: HTMLElement;
  public lastX!: number;
  public lastWidth!: number;

  private isCollapsed: ko.Observable<boolean>;
  private bounds: SplitterBounds;
  private direction: SplitterDirection;

  constructor(options: SplitterOptions) {
    this.splitterId = options.splitterId;
    this.leftSideId = options.leftId;
    this.isCollapsed = ko.observable<boolean>(false);
    this.bounds = options.bounds;
    this.direction = options.direction;
    this.initialize();
  }

  public initialize() {
    if (document.getElementById(this.splitterId) !== null && document.getElementById(this.leftSideId) != null) {
      this.splitter = <HTMLElement>document.getElementById(this.splitterId);
      this.leftSide = <HTMLElement>document.getElementById(this.leftSideId);
    }
    const isVerticalSplitter: boolean = this.direction === SplitterDirection.Vertical;
    const splitterOptions: JQueryUI.ResizableOptions = {
      animate: true,
      animateDuration: "fast",
      start: this.onResizeStart,
      stop: this.onResizeStop,
    };

    if (isVerticalSplitter) {
      $(this.leftSide).css("width", this.bounds.min);
      $(this.splitter).css("height", "100%");

      splitterOptions.maxWidth = this.bounds.max;
      splitterOptions.minWidth = this.bounds.min;
      splitterOptions.handles = { e: "#" + this.splitterId };
    } else {
      $(this.leftSide).css("height", this.bounds.min);
      $(this.splitter).css("width", "100%");

      splitterOptions.maxHeight = this.bounds.max;
      splitterOptions.minHeight = this.bounds.min;
      splitterOptions.handles = { s: "#" + this.splitterId };
    }

    $(this.leftSide).resizable(splitterOptions);
  }

  private onResizeStart: JQueryUI.ResizableEvent = () => {
    if (this.direction === SplitterDirection.Vertical) {
      $(".ui-resizable-helper").height("100%");
    } else {
      $(".ui-resizable-helper").width("100%");
    }
    $("iframe").css("pointer-events", "none");
  };

  private onResizeStop: JQueryUI.ResizableEvent = () => $("iframe").css("pointer-events", "auto");

  public collapseLeft() {
    this.lastX = $(this.splitter).position().left;
    this.lastWidth = $(this.leftSide).width();
    $(this.splitter).css("left", SplitterMetrics.CollapsedPositionLeft);
    $(this.leftSide).css("width", "");
    $(this.leftSide).resizable("option", "disabled", true).removeClass("ui-resizable-disabled"); // remove class so splitter is visible
    $(this.splitter).removeClass("ui-resizable-e");
    this.isCollapsed(true);
  }

  public expandLeft() {
    $(this.splitter).addClass("ui-resizable-e");
    $(this.leftSide).css("width", this.lastWidth);
    $(this.splitter).css("left", this.lastX);
    $(this.splitter).css("left", ""); // this ensures the splitter's position is not fixed and enables movement during resizing
    $(this.leftSide).resizable("enable");
    this.isCollapsed(false);
  }
}
