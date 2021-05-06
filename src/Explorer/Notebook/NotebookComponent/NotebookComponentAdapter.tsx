import * as React from "react";

import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { NotebookClientV2 } from "../NotebookClientV2";

// Vendor modules
import { actions, createContentRef, createKernelRef, selectors } from "@nteract/core";
import VirtualCommandBarComponent from "./VirtualCommandBarComponent";
import { NotebookContentItem } from "../NotebookContentItem";
import { NotebookComponentBootstrapper } from "./NotebookComponentBootstrapper";
import { CdbAppState } from "./types";

export interface NotebookComponentAdapterOptions {
  contentItem: NotebookContentItem;
  notebooksBasePath: string;
  notebookClient: NotebookClientV2;
  onUpdateKernelInfo: () => void;
}

export class NotebookComponentAdapter extends NotebookComponentBootstrapper implements ReactAdapter {
  private onUpdateKernelInfo: () => void;
  public getNotebookParentElement: () => HTMLElement;
  public parameters: any;

  constructor(options: NotebookComponentAdapterOptions) {
    super({
      contentRef: selectors.contentRefByFilepath(options.notebookClient.getStore().getState(), {
        filepath: options.contentItem.path,
      }),
      notebookClient: options.notebookClient,
    });

    this.onUpdateKernelInfo = options.onUpdateKernelInfo;

    if (!this.contentRef) {
      this.contentRef = createContentRef();
      const kernelRef = createKernelRef();

      // Request fetching notebook content
      this.getStore().dispatch(
        actions.fetchContent({
          filepath: options.contentItem.path,
          params: {},
          kernelRef,
          contentRef: this.contentRef,
        })
      );
    }

    this.getNotebookParentElement = () => {
      const cdbAppState = this.getStore().getState() as CdbAppState;
      return cdbAppState.cdb.currentNotebookParentElements.get(this.contentRef);
    };
  }

  protected override renderExtraComponent = (): JSX.Element => {
    return <VirtualCommandBarComponent contentRef={this.contentRef} onRender={this.onUpdateKernelInfo} />;
  };
}
