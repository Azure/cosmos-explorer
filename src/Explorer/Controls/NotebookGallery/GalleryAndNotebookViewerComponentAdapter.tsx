import ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import {
  GalleryAndNotebookViewerComponentProps,
  GalleryAndNotebookViewerComponent,
} from "./GalleryAndNotebookViewerComponent";

export class GalleryAndNotebookViewerComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;

  constructor(private props: GalleryAndNotebookViewerComponentProps) {
    this.parameters = ko.observable<number>(Date.now());
  }

  public renderComponent(): JSX.Element {
    return <GalleryAndNotebookViewerComponent {...this.props} />;
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
