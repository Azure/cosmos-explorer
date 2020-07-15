import { Card } from "@uifabric/react-cards";
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
  showDownload: boolean;
  showDelete: boolean;
  onClick: () => void;
  onTagClick: (tag: string) => void;
  onFavoriteClick: () => void;
  onUnfavoriteClick: () => void;
  onDownloadClick: () => void;
  onDeleteClick: () => void;
}

export class GalleryCardComponent extends React.Component<GalleryCardComponentProps> {
  public static readonly CARD_WIDTH = 256;
  private static readonly cardImageHeight = 144;
  private static readonly cardDescriptionMaxChars = 88;
  private static readonly cardItemGapBig = 10;
  private static readonly cardItemGapSmall = 8;

  public render(): JSX.Element {
    const cardButtonsVisible = this.props.isFavorite !== undefined || this.props.showDownload || this.props.showDelete;
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric"
    };
    const dateString = new Date(this.props.data.created).toLocaleString("default", options);

    return (
      <Card
        aria-label="Notebook Card"
        tokens={{ width: GalleryCardComponent.CARD_WIDTH, childrenGap: 0 }}
        onClick={this.props.onClick}
      >
        <Card.Item tokens={{ padding: GalleryCardComponent.cardItemGapBig }}>
          <Persona
            imageUrl={this.props.data.isSample && CosmosDBLogo}
            text={this.props.data.author}
            secondaryText={dateString}
          />
        </Card.Item>

        <Card.Item>
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

        <Card.Section styles={{ root: { padding: GalleryCardComponent.cardItemGapBig } }}>
          <Text variant="small" nowrap>
            {this.props.data.tags?.map((tag, index, array) => (
              <span key={tag}>
                <Link onClick={(event): void => this.onTagClick(event, tag)}>{tag}</Link>
                {index === array.length - 1 ? <></> : ", "}
              </span>
            ))}
          </Text>

          <Text
            styles={{
              root: {
                fontWeight: FontWeights.semibold,
                paddingTop: GalleryCardComponent.cardItemGapSmall,
                paddingBottom: GalleryCardComponent.cardItemGapSmall
              }
            }}
            nowrap
          >
            {FileSystemUtil.stripExtension(this.props.data.name, "ipynb")}
          </Text>

          <Text variant="small" styles={{ root: { height: 36 } }}>
            {this.props.data.description.substr(0, GalleryCardComponent.cardDescriptionMaxChars)}
          </Text>

          <span>
            {this.generateIconText("RedEye", this.props.data.views.toString())}
            {this.generateIconText("Download", this.props.data.downloads.toString())}
            {this.props.isFavorite !== undefined &&
              this.generateIconText("Heart", this.props.data.favorites.toString())}
          </span>
        </Card.Section>

        {cardButtonsVisible && (
          <Card.Section
            styles={{
              root: {
                marginLeft: GalleryCardComponent.cardItemGapBig,
                marginRight: GalleryCardComponent.cardItemGapBig
              }
            }}
          >
            <Separator styles={{ root: { padding: 0, height: 1 } }} />

            <span>
              {this.props.isFavorite !== undefined &&
                this.generateIconButtonWithTooltip(
                  this.props.isFavorite ? "HeartFill" : "Heart",
                  this.props.isFavorite ? "Unlike" : "Like",
                  false,
                  this.props.isFavorite ? this.onUnfavoriteClick : this.onFavoriteClick
                )}

              {this.props.showDownload &&
                this.generateIconButtonWithTooltip("Download", "Download", false, this.onDownloadClick)}

              {this.props.showDelete &&
                this.generateIconButtonWithTooltip("Delete", "Remove", true, this.onDeleteClick)}
            </span>
          </Card.Section>
        )}
      </Card>
    );
  }

  private generateIconText = (iconName: string, text: string): JSX.Element => {
    return (
      <Text variant="tiny" styles={{ root: { color: "#ccc", paddingRight: GalleryCardComponent.cardItemGapSmall } }}>
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
    rightAlign: boolean,
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
        styles={{ root: { display: "inline-block", float: rightAlign ? "right" : "left" } }}
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
