import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import Explorer from "../Explorer";
import ko from "knockout";
import { GenericRightPaneProps, GenericRightPaneComponent } from "./GenericRightPaneComponent";
import React from "react";
import { AddDatabaseComponentProps, AddDatabaseComponent } from "./AddDatabaseComponent";

export class AddDatabasePaneAdapter implements ReactAdapter {
  parameters: ko.Observable<number>;
  private isOpened: boolean;
  private isExecuting: boolean;
  private formError: string;
  private formErrorDetail: string;

  constructor(private container: Explorer) {
    this.parameters = ko.observable(Date.now());
    this.reset();
    this.triggerRender();
  }

  public renderComponent(): JSX.Element {
    if (!this.isOpened) {
      return undefined;
    }

    const props: GenericRightPaneProps = {
      container: this.container,
      content: this.createContent(),
      formError: this.formError,
      formErrorDetail: this.formErrorDetail,
      id: "adddatabasepane",
      isExecuting: this.isExecuting,
      title: "New Database",
      submitButtonText: "OK",
      onClose: () => this.close(),
      onSubmit: () => this.submit()
    };

    return <GenericRightPaneComponent {...props} />;
  }

  private createContent = (): JSX.Element => {
    const props: AddDatabaseComponentProps = {
      defaultThroughputConfigurationVisible: true
    };

    return (
      <div className="panelContent">
        <div className="paneMainContent">
          <AddDatabaseComponent {...props} />
        </div>
      </div>
    );
  };
  
  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }

  private reset = (): void => {
    this.isOpened = false;
    this.isExecuting = false;
    this.formError = undefined;
    this.formErrorDetail = undefined;
  }

  public open(): void {
    this.isOpened = true;
    this.triggerRender();
  }

  public close(): void {
    this.reset();
    this.triggerRender();
  }

  public async submit(): Promise<void> {
    // TODO
    this.reset();
    this.triggerRender();
  }
}