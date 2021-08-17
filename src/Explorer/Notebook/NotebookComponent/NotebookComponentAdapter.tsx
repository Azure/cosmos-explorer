// Vendor modules
import { actions, createContentRef, createKernelRef, selectors } from "@nteract/core";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import { NotebookClientV2 } from "../NotebookClientV2";
import { NotebookContentItem } from "../NotebookContentItem";
import { NotebookComponentBootstrapper } from "./NotebookComponentBootstrapper";
import VirtualCommandBarComponent from "./VirtualCommandBarComponent";

export interface NotebookComponentAdapterOptions {
  contentItem: NotebookContentItem;
  notebooksBasePath: string;
  notebookClient: NotebookClientV2;
  onUpdateKernelInfo: () => void;
}

export class NotebookComponentAdapter extends NotebookComponentBootstrapper implements ReactAdapter {
  private onUpdateKernelInfo: () => void;
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
  }

  protected renderExtraComponent = (): JSX.Element => {
    return <VirtualCommandBarComponent contentRef={this.contentRef} onRender={this.onUpdateKernelInfo} />;
  };
}
