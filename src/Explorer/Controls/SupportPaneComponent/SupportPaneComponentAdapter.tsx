import * as ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import Explorer from "../../Explorer";
import { SupportPaneComponent } from "./SupportPaneComponent";

export interface SupportPaneComponentParams {
  directLineAccessToken: string;
}

export class SupportPaneComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<SupportPaneComponentParams>;

  constructor(private container: Explorer) {
    this.parameters = ko.observable<SupportPaneComponentParams>({
      directLineAccessToken: this.container.conversationToken()
    });
    this.container.conversationToken.subscribe(accessToken => {
      this.parameters().directLineAccessToken = accessToken;
      this.forceRender();
    });
  }

  public renderComponent(): JSX.Element {
    return <SupportPaneComponent directLineToken={this.parameters().directLineAccessToken} />;
  }

  public forceRender(): void {
    this.parameters.valueHasMutated();
  }
}
