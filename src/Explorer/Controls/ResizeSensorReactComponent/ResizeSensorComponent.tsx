/**
 * Generic abstract React component that senses its dimensions.
 * It updates its state and re-renders if dimensions change.
 */

import * as React from "react";
import * as ResizeSensor from "css-element-queries/src/ResizeSensor";

export abstract class ResizeSensorComponent<P, S> extends React.Component<P, S> {
  private isSensing: boolean = false;
  private resizeSensor: any;

  public constructor(props: P) {
    super(props);
  }

  protected abstract onDimensionsChanged(width: number, height: number): void;
  protected abstract getSensorTarget(): HTMLElement;

  public componentDidUpdate(): void {
    if (this.isSensing) {
      return;
    }

    const bar = this.getSensorTarget();
    if (bar.clientWidth > 0 || bar.clientHeight > 0) {
      const oldPosition = bar.style.position;
      // TODO Find a better way to use constructor
      this.resizeSensor = new (ResizeSensor as any)(bar, () => {
        this.onDimensionsChanged(bar.clientWidth, bar.clientHeight);
      });
      this.isSensing = true;

      // ResizeSensor.js sets position to 'relative' which makes the dropdown menu appear clipped.
      // Undoing doesn't seem to affect resize sensing functionality.
      bar.style.position = oldPosition;
    }
  }

  public componentWillUnmount(): void {
    if (!!this.resizeSensor) {
      this.resizeSensor.detach();
    }
  }
}
