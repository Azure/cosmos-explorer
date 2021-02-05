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
  TooltipHost,
} from "office-ui-fabric-react";
import * as React from "react";
import { IGalleryItem } from "../../../../Juno/JunoClient";
import { FileSystemUtil } from "../../../Notebook/FileSystemUtil";
import CosmosDBLogo from "../../../../../images/CosmosDB-logo.svg";
import { StyleConstants } from "../../../../Common/Constants";

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
  public static readonly cardHeightToWidthRatio =
    GalleryCardComponent.cardImageHeight / GalleryCardComponent.CARD_WIDTH;
  private static readonly cardDescriptionMaxChars = 80;
  private static readonly cardItemGapBig = 10;
  private static readonly cardItemGapSmall = 8;

  public render(): JSX.Element {
    const cardButtonsVisible = this.props.isFavorite !== undefined || this.props.showDownload || this.props.showDelete;
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const dateString = new Date(this.props.data.created).toLocaleString("default", options);
    const cardTitle = FileSystemUtil.stripExtension(this.props.data.name, "ipynb");

    return (
      <Card
        style={{ background: "white" }}
        aria-label={cardTitle}
        data-is-focusable="true"
        tokens={{ width: GalleryCardComponent.CARD_WIDTH, childrenGap: 0 }}
        onClick={(event) => this.onClick(event, this.props.onClick)}
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
            src={this.props.data.thumbnailUrl}
            width={GalleryCardComponent.CARD_WIDTH}
            height={GalleryCardComponent.cardImageHeight}
            imageFit={ImageFit.cover}
            alt={`${cardTitle} cover image`}
          />
        </Card.Item>

        <Card.Section styles={{ root: { padding: GalleryCardComponent.cardItemGapBig } }}>
          <Text variant="small" nowrap>
            {this.props.data.tags ? (
              this.props.data.tags.map((tag, index, array) => (
                <span key={tag}>
                  <Link onClick={(event) => this.onClick(event, () => this.props.onTagClick(tag))}>{tag}</Link>
                  {index === array.length - 1 ? <></> : ", "}
                </span>
              ))
            ) : (
              <br />
            )}
          </Text>

          <Text
            styles={{
              root: {
                fontWeight: FontWeights.semibold,
                paddingTop: GalleryCardComponent.cardItemGapSmall,
                paddingBottom: GalleryCardComponent.cardItemGapSmall,
              },
            }}
            nowrap
          >
            {cardTitle}
          </Text>

          <Text variant="small" styles={{ root: { height: 36 } }}>
            {this.renderTruncatedDescription()}
          </Text>

          <span>
            {this.props.data.views !== undefined && this.generateIconText("RedEye", this.props.data.views.toString())}
            {this.props.data.downloads !== undefined &&
              this.generateIconText("Download", this.props.data.downloads.toString())}
            {this.props.data.favorites !== undefined &&
              this.generateIconText("Heart", this.props.data.favorites.toString())}
          </span>
        </Card.Section>

        {cardButtonsVisible && (
          <Card.Section
            styles={{
              root: {
                marginLeft: GalleryCardComponent.cardItemGapBig,
                marginRight: GalleryCardComponent.cardItemGapBig,
              },
            }}
          >
            <Separator styles={{ root: { padding: 0, height: 1 } }} />

            <span>
              {this.props.isFavorite !== undefined &&
                this.generateIconButtonWithTooltip(
                  this.props.isFavorite ? "HeartFill" : "Heart",
                  this.props.isFavorite ? "Unfavorite" : "Favorite",
                  "left",
                  this.props.isFavorite ? this.props.onUnfavoriteClick : this.props.onFavoriteClick
                )}

              {this.props.showDownload &&
                this.generateIconButtonWithTooltip("Download", "Download", "left", this.props.onDownloadClick)}

              {this.props.showDelete &&
                this.generateIconButtonWithTooltip("Delete", "Remove", "right", this.props.onDeleteClick)}
            </span>
          </Card.Section>
        )}
      </Card>
    );
  }

  private renderTruncatedDescription = (): string => {
    let truncatedDescription = this.props.data.description.substr(0, GalleryCardComponent.cardDescriptionMaxChars);
    if (this.props.data.description.length > GalleryCardComponent.cardDescriptionMaxChars) {
      truncatedDescription = `${truncatedDescription} ...`;
    }
    return truncatedDescription;
  };

  private generateIconText = (iconName: string, text: string): JSX.Element => {
    return (
      <Text variant="tiny" styles={{ root: { color: "#605E5C", paddingRight: GalleryCardComponent.cardItemGapSmall } }}>
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
    horizontalAlign: "right" | "left",
    activate: () => void
  ): JSX.Element => {
    return (
      <TooltipHost
        content={title}
        id={`TooltipHost-IconButton-${iconName}`}
        calloutProps={{ gapSpace: 0 }}
        styles={{ root: { display: "inline-block", float: horizontalAlign } }}
      >
        <IconButton
          iconProps={{ iconName }}
          title={title}
          ariaLabel={title}
          onClick={(event) => this.onClick(event, activate)}
        />
      </TooltipHost>
    );
  };

  private onClick = (
    event:
      | React.MouseEvent<HTMLElement | HTMLAnchorElement | HTMLButtonElement | LinkBase, MouseEvent>
      | React.MouseEvent<
          HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton | Button | HTMLSpanElement,
          MouseEvent
        >,
    activate: () => void
  ): void => {
    event.stopPropagation();
    event.preventDefault();
    activate();
  };
}
