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

  private bounds: SplitterBounds;
  private direction: SplitterDirection;

  constructor(options: SplitterOptions) {
    this.splitterId = options.splitterId;
    this.leftSideId = options.leftId;
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
}
