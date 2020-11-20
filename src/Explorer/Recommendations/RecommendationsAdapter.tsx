/**
 * This adapter is responsible to render the React component
 * If the component signals a change through the callback passed in the properties, it must render the React component when appropriate
 * and update any knockout observables passed from the parent.
 */
import * as ko from "knockout";
import * as React from "react";
import { ReactAdapter } from "../../Bindings/ReactBindingHandler";
import * as ViewModels from "../../Contracts/ViewModels";
import { MessageBar, MessageBarType, Text} from "office-ui-fabric-react";
import { StyleConstants } from "../../Common/Constants";
import Explorer from "../Explorer";
// import {getRecommendations} from "./api";
import { configContext } from "../../ConfigContext";
import { JunoClient } from "../../Juno/JunoClient";
import { ICardTokens, Card } from "@uifabric/react-cards";
import {Recommendations, RecommendationProps} from "./RecommendationsComponent";
// import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";

export class RecommendationsAdapter implements ReactAdapter {
public parameters: ko.Observable<number>;
  public container: Explorer;
  
  

  constructor(container: Explorer) {
    this.container = container;
    this.parameters = ko.observable<number>(Date.now());
  
  }

  public forceRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }

  public renderComponent(): JSX.Element {
    //const backgroundColor = StyleConstants.BaseLight;
    
    
    return (
      <Recommendations explorer={this.container}/>
    );
  }

  public triggerRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }

  
}
