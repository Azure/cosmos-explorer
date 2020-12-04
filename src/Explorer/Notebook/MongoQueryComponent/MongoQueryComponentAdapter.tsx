import * as React from "react";

import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import {
  NotebookComponentBootstrapper,
  NotebookComponentBootstrapperOptions
} from "../NotebookComponent/NotebookComponentBootstrapper";
import MongoQueryComponent from "../MongoQueryComponent/MongoQueryComponent";
import { actions, createContentRef, createKernelRef, KernelRef } from "@nteract/core";
import { Provider } from "react-redux";

export class MongoQueryComponentAdapter extends NotebookComponentBootstrapper implements ReactAdapter {
  public parameters: unknown;
  private kernelRef: KernelRef;

  constructor(options: NotebookComponentBootstrapperOptions, private databaseId: string, private collectionId: string) {
    super(options);

    if (!this.contentRef) {
      this.contentRef = createContentRef();
      this.kernelRef = createKernelRef();

      // Request fetching notebook content
      this.getStore().dispatch(
        actions.fetchContent({
          filepath: "mongo.ipynb",
          params: {},
          kernelRef: this.kernelRef,
          contentRef: this.contentRef
        })
      );
    }
  }

  public renderComponent(): JSX.Element {
    const props = {
      contentRef: this.contentRef,
      kernelRef: this.kernelRef,
      databaseId: this.databaseId,
      collectionId: this.collectionId
    };

    return (
      <Provider store={this.getStore()}>
        <MongoQueryComponent {...props} />;
      </Provider>
    );
  }
}
