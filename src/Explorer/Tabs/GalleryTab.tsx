import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import TabsBase from "./TabsBase";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import { GalleryViewerContainerComponent } from "../Controls/NotebookGallery/GalleryViewerComponent";

/**
 * Notebook gallery tab
 */
class GalleryComponentAdapter implements ReactAdapter {
  public parameters: ko.Computed<boolean>;
  constructor(private getContainer: () => ViewModels.Explorer) {}

  public renderComponent(): JSX.Element {
    return this.parameters() ? <GalleryViewerContainerComponent container={this.getContainer()} /> : <></>;
  }
}

export default class GalleryTab extends TabsBase implements ViewModels.Tab {
  private container: ViewModels.Explorer;
  private galleryComponentAdapter: GalleryComponentAdapter;

  constructor(options: ViewModels.GalleryTabOptions) {
    super(options);
    this.container = options.container;
    this.galleryComponentAdapter = new GalleryComponentAdapter(() => this.getContainer());

    this.galleryComponentAdapter.parameters = ko.computed<boolean>(() => {
      return this.isTemplateReady() && this.container.isNotebookEnabled();
    });
  }

  protected getContainer(): ViewModels.Explorer {
    return this.container;
  }

  protected getTabsButtons(): ViewModels.NavbarButtonConfig[] {
    return [];
  }

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }
}
