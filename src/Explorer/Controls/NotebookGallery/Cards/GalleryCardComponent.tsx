import { Card, ICardTokens } from "@uifabric/react-cards";
import {
  FontWeights,
  Icon,
  IconButton,
  Image,
  ImageFit,
  Persona,
  Text,
  Link,
  BaseButton,
  Button,
  LinkBase,
  Separator,
  TooltipHost
} from "office-ui-fabric-react";
import * as React from "react";
import { IGalleryItem } from "../../../../Juno/JunoClient";
import { FileSystemUtil } from "../../../Notebook/FileSystemUtil";
import CosmosDBLogo from "../../../../../images/CosmosDB-logo.svg";

export interface GalleryCardComponentProps {
  data: IGalleryItem;
  isFavorite: boolean;
  showDelete: boolean;
  onClick: () => void;
  onTagClick: (tag: string) => void;
  onFavoriteClick: () => void;
  onUnfavoriteClick: () => void;
  onDownloadClick: () => void;
  onDeleteClick: () => void;
}

export class GalleryCardComponent extends React.Component<GalleryCardComponentProps> {
  public static readonly CARD_HEIGHT = 384;
  public static readonly CARD_WIDTH = 256;

  private static readonly cardImageHeight = 144;
  private static readonly cardDescriptionMaxChars = 88;
  private static readonly cardTokens: ICardTokens = {
    width: GalleryCardComponent.CARD_WIDTH,
    height: GalleryCardComponent.CARD_HEIGHT,
    childrenGap: 8,
    childrenMargin: 10
  };

  public render(): JSX.Element {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric"
    };

    const dateString = new Date(this.props.data.created).toLocaleString("default", options);

    return (
      <Card aria-label="Notebook Card" tokens={GalleryCardComponent.cardTokens} onClick={this.props.onClick}>
        <Card.Item>
          <Persona
            imageUrl={this.props.data.isSample && CosmosDBLogo}
            text={this.props.data.author}
            secondaryText={dateString}
          />
        </Card.Item>

        <Card.Item fill>
          <Image
            src={
              this.props.data.thumbnailUrl ||
              `https://placehold.it/${GalleryCardComponent.CARD_WIDTH}x${GalleryCardComponent.cardImageHeight}`
            }
            width={GalleryCardComponent.CARD_WIDTH}
            height={GalleryCardComponent.cardImageHeight}
            imageFit={ImageFit.cover}
            alt="Notebook cover image"
          />
        </Card.Item>

        <Card.Section>
          <Text variant="small" nowrap>
            {this.props.data.tags?.map((tag, index, array) => (
              <span key={tag}>
                <Link onClick={(event): void => this.onTagClick(event, tag)}>{tag}</Link>
                {index === array.length - 1 ? <></> : ", "}
              </span>
            ))}
          </Text>
          <Text styles={{ root: { fontWeight: FontWeights.semibold } }} nowrap>
            {FileSystemUtil.stripExtension(this.props.data.name, "ipynb")}
          </Text>
          <Text variant="small" styles={{ root: { height: 36 } }}>
            {this.props.data.description.substr(0, GalleryCardComponent.cardDescriptionMaxChars)}
          </Text>
        </Card.Section>

        <Card.Section horizontal styles={{ root: { alignItems: "flex-end" } }}>
          {this.generateIconText("RedEye", this.props.data.views.toString())}
          {this.generateIconText("Download", this.props.data.downloads.toString())}
          {this.props.isFavorite !== undefined && this.generateIconText("Heart", this.props.data.favorites.toString())}
        </Card.Section>

        <Card.Item>
          <Separator styles={{ root: { padding: 0, height: 1 } }} />
        </Card.Item>

        <Card.Section horizontal styles={{ root: { marginTop: 0 } }}>
          {this.props.isFavorite !== undefined &&
            this.generateIconButtonWithTooltip(
              this.props.isFavorite ? "HeartFill" : "Heart",
              this.props.isFavorite ? "Unlike" : "Like",
              this.props.isFavorite ? this.onUnfavoriteClick : this.onFavoriteClick
            )}

          {this.generateIconButtonWithTooltip("Download", "Download", this.onDownloadClick)}

          {this.props.showDelete && (
            <div style={{ width: "100%", textAlign: "right" }}>
              {this.generateIconButtonWithTooltip("Delete", "Remove", this.onDeleteClick)}
            </div>
          )}
        </Card.Section>
      </Card>
    );
  }

  private generateIconText = (iconName: string, text: string): JSX.Element => {
    return (
      <Text variant="tiny" styles={{ root: { color: "#ccc" } }}>
        <Icon iconName={iconName} styles={{ root: { verticalAlign: "middle" } }} /> {text}
      </Text>
    );
  };

  /*
   * Fluent UI doesn't support tooltips on IconButtons out of the box. In the meantime the recommendation is
   * to do the following (from https://developer.microsoft.com/en-us/fluentui#/controls/web/button)
   */
  private generateIconButtonWithTooltip = (
    iconName: string,
    title: string,
    onClick: (
      event: React.MouseEvent<
        HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton | Button | HTMLSpanElement,
        MouseEvent
      >
    ) => void
  ): JSX.Element => {
    return (
      <TooltipHost
        content={title}
        id={`TooltipHost-IconButton-${iconName}`}
        calloutProps={{ gapSpace: 0 }}
        styles={{ root: { display: "inline-block" } }}
      >
        <IconButton iconProps={{ iconName }} title={title} ariaLabel={title} onClick={onClick} />
      </TooltipHost>
    );
  };

  private onTagClick = (
    event: React.MouseEvent<HTMLElement | HTMLAnchorElement | HTMLButtonElement | LinkBase, MouseEvent>,
    tag: string
  ): void => {
    event.stopPropagation();
    this.props.onTagClick(tag);
  };

  private onFavoriteClick = (
    event: React.MouseEvent<
      HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton | Button | HTMLSpanElement,
      MouseEvent
    >
  ): void => {
    event.stopPropagation();
    this.props.onFavoriteClick();
  };

  private onUnfavoriteClick = (
    event: React.MouseEvent<
      HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton | Button | HTMLSpanElement,
      MouseEvent
    >
  ): void => {
    event.stopPropagation();
    this.props.onUnfavoriteClick();
  };

  private onDownloadClick = (
    event: React.MouseEvent<
      HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton | Button | HTMLSpanElement,
      MouseEvent
    >
  ): void => {
    event.stopPropagation();
    this.props.onDownloadClick();
  };

  private onDeleteClick = (
    event: React.MouseEvent<
      HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton | Button | HTMLSpanElement,
      MouseEvent
    >
  ): void => {
    event.stopPropagation();
    this.props.onDeleteClick();
  };
}
