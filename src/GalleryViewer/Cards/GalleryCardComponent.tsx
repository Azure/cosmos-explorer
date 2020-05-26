import * as React from "react";
import * as DataModels from "../../Contracts/DataModels";
import { Card, ICardTokens, ICardSectionTokens } from "@uifabric/react-cards";
import { Icon, Image, Persona, Text } from "office-ui-fabric-react";
import {
  siteTextStyles,
  descriptionTextStyles,
  helpfulTextStyles,
  subtleHelpfulTextStyles,
  subtleIconStyles
} from "./CardStyleConstants";

interface GalleryCardComponentProps {
  name: string;
  url: string;
  notebookMetadata: DataModels.NotebookMetadata;
  onClick: () => void;
}

export class GalleryCardComponent extends React.Component<GalleryCardComponentProps> {
  private cardTokens: ICardTokens = { childrenMargin: 12 };
  private attendantsCardSectionTokens: ICardSectionTokens = { childrenGap: 6 };

  public render(): JSX.Element {
    return this.props.notebookMetadata != null ? (
      <Card aria-label="Notebook Card" onClick={this.props.onClick} tokens={this.cardTokens}>
        <Card.Item>
          <Persona text={this.props.notebookMetadata.author} secondaryText={this.props.notebookMetadata.date} />
        </Card.Item>
        <Card.Item fill>
          <Image src={this.props.notebookMetadata.imageUrl} width="100%" alt="Notebook display image" />
        </Card.Item>
        <Card.Section>
          <Text variant="small" styles={siteTextStyles}>
            {this.props.notebookMetadata.tags.join(", ")}
          </Text>
          <Text styles={descriptionTextStyles}>{this.props.name}</Text>
          <Text variant="small" styles={helpfulTextStyles}>
            {this.props.notebookMetadata.description}
          </Text>
        </Card.Section>
        <Card.Section horizontal tokens={this.attendantsCardSectionTokens}>
          <Icon iconName="RedEye" styles={subtleIconStyles} />
          <Text variant="small" styles={subtleHelpfulTextStyles}>
            {this.props.notebookMetadata.views}
          </Text>
          <Icon iconName="Download" styles={subtleIconStyles} />
          <Text variant="small" styles={subtleHelpfulTextStyles}>
            {this.props.notebookMetadata.downloads}
          </Text>
          <Icon iconName="Heart" styles={subtleIconStyles} />
          <Text variant="small" styles={subtleHelpfulTextStyles}>
            {this.props.notebookMetadata.likes}
          </Text>
        </Card.Section>
      </Card>
    ) : (
      <Card aria-label="Notebook Card" onClick={this.props.onClick} tokens={this.cardTokens}>
        <Card.Section>
          <Text styles={descriptionTextStyles}>{this.props.name}</Text>
        </Card.Section>
      </Card>
    );
  }
}
