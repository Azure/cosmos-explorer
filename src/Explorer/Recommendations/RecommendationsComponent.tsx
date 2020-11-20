import { ICardTokens, Card } from "@uifabric/react-cards";
import React from "react";
import { JunoClient } from "../../Juno/JunoClient";
import Explorer from "../Explorer";
import { MessageBar, MessageBarButton, MessageBarType, IMessageBarStyles, Spinner } from "office-ui-fabric-react";
import { FontSize } from "../Controls/GitHub/GitHubStyleConstants";

export interface RecommendationProps {
    explorer: Explorer;

  }

  export const recoStyles: Partial<IMessageBarStyles> = { root: { backgroundColor: "#0078d4" ,
   color:"white", fontSize: "16px"}, text: {fontSize: "16px"}, icon: {display: "none"}};

   export const recoButtonStyles = {root: {fontSize: "10px"}};

export class Recommendations extends React.Component<RecommendationProps> {

    public state: { recoMessage: string; loadingInfo: boolean;};
    container: Explorer;
    
        
    constructor(props: RecommendationProps) {
        super(props);
        //this.container = this.container;
        this.state = {
          recoMessage:"",
          loadingInfo: false
        }
        this.loadInfo();
      }

      private async loadInfo(){
        this.setState({loadingInfo: true});
        let junoClient = new JunoClient(this.props.explorer.databaseAccount);
      
        let resp = await junoClient.getRecos();
        // this.state.recoMessage = resp.description;
      
        this.setState({recoMessage: resp.description});
        this.setState({loadingInfo: false});
      }

      private clear = () => {
        this.setState({recoMessage: null})
      };

      private clear1()
      {
        this.setState({recoMessage: null})
      }

    render() {
      if (this.state.loadingInfo)
      {
        return (<React.Fragment> <Spinner/> Loading your Recommendation </React.Fragment>);
      }
      else
      {
        if (this.state.recoMessage)
        {
        return (
          <React.Fragment>
            <MessageBar           
              dismissButtonAriaLabel="Close"
              messageBarType={MessageBarType.warning}
              actions={
                <div>
                   <MessageBarButton onClick={this.clear} styles={recoButtonStyles}>Remind me later</MessageBarButton>
                  <MessageBarButton onClick={this.clear} styles={recoButtonStyles}>Got it</MessageBarButton>
                </div>
              }
              styles={recoStyles}
            >
            {this.state.recoMessage}
             </MessageBar>

          </React.Fragment>);
        }
        else
        {
            return null;
        }
      
      }
    
  }
}