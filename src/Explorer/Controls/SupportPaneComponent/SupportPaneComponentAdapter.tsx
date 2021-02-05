import * as ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import Explorer from "../../Explorer";
import { SupportPaneComponent } from "./SupportPaneComponent";
import { userContext } from "../../../UserContext";

export interface SupportPaneComponentParams {
  directLineAccessToken: string;
  userToken: string;
  subId: string;
  rg: string;
  accName: string;
}

export class SupportPaneComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<SupportPaneComponentParams>;

  constructor(private container: Explorer) {
    
    this.parameters = ko.observable<SupportPaneComponentParams>({
      directLineAccessToken: this.container.conversationToken(),
      userToken: this.container.userToken(),
      subId: this.container.subId(),
      rg: this.container.rg(),
      accName: this.container.accName()
    });
    this.container.conversationToken.subscribe(accessToken => {
      this.parameters().directLineAccessToken = accessToken;
      this.forceRender();
    });
    this.container.userToken.subscribe(userToken => {
      this.parameters().userToken = userToken;
      this.forceRender();
    });
    this.container.subId.subscribe(subId => {
      this.parameters().subId = subId;
      this.forceRender();
    });
    this.container.rg.subscribe(rg => {
      this.parameters().rg = rg;
      this.forceRender();
    });
    this.container.accName.subscribe(accName => {
      this.parameters().accName = accName;
      this.forceRender();
    });
    
  }

  public renderComponent(): JSX.Element {
    return <SupportPaneComponent 
    directLineToken={this.parameters().directLineAccessToken} 
    userToken={this.parameters().userToken}
    subId={this.parameters().subId}
    rg={this.parameters().rg}
    accName={this.parameters().accName}
    />;
  }

  public forceRender(): void {
    this.parameters.valueHasMutated();
  }
}
