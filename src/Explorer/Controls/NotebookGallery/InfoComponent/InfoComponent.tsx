import * as React from "react";
import { Icon, Label, Stack, HoverCard, HoverCardType, Link } from "office-ui-fabric-react";
import { CodeOfConductEndpoints } from "../../../../Common/Constants";
import "./InfoComponent.less";

export class InfoComponent extends React.Component {
  private getInfoPanel = (iconName: string, labelText: string, url: string): JSX.Element => {
    return (
      <Link href={url} target="_blank">
        <div className="infoPanel">
          <Icon iconName={iconName} styles={{ root: { verticalAlign: "middle" } }} />
          <Label className="infoLabel">{labelText}</Label>
        </div>
      </Link>
    );
  };

  private onHover = (): JSX.Element => {
    return (
      <Stack tokens={{ childrenGap: 5, padding: 5 }}>
        <Stack.Item>{this.getInfoPanel("Script", "Code of Conduct", CodeOfConductEndpoints.codeOfConduct)}</Stack.Item>
        <Stack.Item>
          {this.getInfoPanel("RedEye", "Privacy Statement", CodeOfConductEndpoints.privacyStatement)}
        </Stack.Item>
        <Stack.Item>
          {this.getInfoPanel("KnowledgeArticle", "Microsoft Terms of Use", CodeOfConductEndpoints.termsOfUse)}
        </Stack.Item>
      </Stack>
    );
  };

  public render(): JSX.Element {
    return (
      <HoverCard plainCardProps={{ onRenderPlainCard: this.onHover }} instantOpenOnClick type={HoverCardType.plain}>
        <div className="infoPanelMain">
          <Icon className="infoIconMain" iconName="Help" styles={{ root: { verticalAlign: "middle" } }} />
          <Label className="infoLabelMain">Help</Label>
        </div>
      </HoverCard>
    );
  }
}
