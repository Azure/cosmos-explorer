import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import {
  GalleryAndNotebookViewerComponent,
  GalleryAndNotebookViewerComponentProps,
} from "./GalleryAndNotebookViewerComponent";

export class GalleryAndNotebookViewerComponentAdapter implements ReactAdapter {
  private key: string;
  public parameters: ko.Observable<number>;

  constructor(private props: GalleryAndNotebookViewerComponentProps) {
    this.reset();
    this.parameters = ko.observable<number>(Date.now());
  }

  public renderComponent(): JSX.Element {
    return <GalleryAndNotebookViewerComponent key={this.key} {...this.props} />;
  }

  public reset(): void {
    this.key = `GalleryAndNotebookViewerComponent-${Date.now()}`;
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
