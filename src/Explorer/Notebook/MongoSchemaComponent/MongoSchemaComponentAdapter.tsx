import { Notebook } from "@nteract/commutable";
import { actions, createContentRef, createKernelRef, IContent, KernelRef } from "@nteract/core";
import * as React from "react";
import { Provider } from "react-redux";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import {
  NotebookComponentBootstrapper,
  NotebookComponentBootstrapperOptions,
} from "../NotebookComponent/NotebookComponentBootstrapper";
import MongoSchemaComponent from "./MongoSchemaComponent";

export class MongoSchemaComponentAdapter extends NotebookComponentBootstrapper implements ReactAdapter {
  public parameters: unknown;
  private kernelRef: KernelRef;

  constructor(options: NotebookComponentBootstrapperOptions, private databaseId: string, private collectionId: string) {
    super(options);

    if (!this.contentRef) {
      this.contentRef = createContentRef();
      this.kernelRef = createKernelRef();

      const notebook: Notebook = {
        cells: [
          {
            cell_type: "code",
            metadata: {},
            execution_count: 0,
            outputs: [],
            source: "",
          },
        ],
        metadata: {
          kernelspec: {
            displayName: "Mongo",
            language: "mongocli",
            name: "mongo",
          },
          language_info: {
            file_extension: "ipynb",
            mimetype: "application/json",
            name: "mongo",
            version: "1.0",
          },
        },
        nbformat: 4,
        nbformat_minor: 4,
      };

      const model: IContent<"notebook"> = {
        name: "mongo-schema-component-notebook.ipynb",
        path: "mongo-schema-component-notebook.ipynb",
        type: "notebook",
        writable: true,
        created: "",
        last_modified: "",
        mimetype: "application/x-ipynb+json",
        content: notebook,
        format: "json",
      };

      // Request fetching notebook content
      this.getStore().dispatch(
        actions.fetchContentFulfilled({
          filepath: model.path,
          model,
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
        <MongoSchemaComponent {...props} />;
      </Provider>
    );
  }
}
