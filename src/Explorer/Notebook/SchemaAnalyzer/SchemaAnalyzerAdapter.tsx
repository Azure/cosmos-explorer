import { actions, createContentRef, createKernelRef, KernelRef } from "@nteract/core";
import * as React from "react";
import { Provider } from "react-redux";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import {
  NotebookComponentBootstrapper,
  NotebookComponentBootstrapperOptions,
} from "../NotebookComponent/NotebookComponentBootstrapper";
import SchemaAnalyzer from "./SchemaAnalyzer";
import { SchemaAnalyzerNotebook } from "./SchemaAnalyzerUtils";

export class SchemaAnalyzerAdapter extends NotebookComponentBootstrapper implements ReactAdapter {
  public parameters: unknown;
  private kernelRef: KernelRef;

  constructor(options: NotebookComponentBootstrapperOptions, private databaseId: string, private collectionId: string) {
    super(options);

    if (!this.contentRef) {
      this.contentRef = createContentRef();
      this.kernelRef = createKernelRef();

      this.getStore().dispatch(
        actions.fetchContent({
          filepath: SchemaAnalyzerNotebook.path,
          params: {},
          kernelRef: this.kernelRef,
          contentRef: this.contentRef,
        })
      );
    }
  }

  public renderComponent(): JSX.Element {
    const props = {
      contentRef: this.contentRef,
      kernelRef: this.kernelRef,
      databaseId: this.databaseId,
      collectionId: this.collectionId,
    };

    return (
      <Provider store={this.getStore()}>
        <SchemaAnalyzer {...props} />;
      </Provider>
    );
  }
}
