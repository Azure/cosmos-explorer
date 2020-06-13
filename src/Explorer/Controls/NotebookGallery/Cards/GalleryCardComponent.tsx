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
  Stack,
  BaseButton,
  Button,
  LinkBase
} from "office-ui-fabric-react";
import * as React from "react";
import { IGalleryItem } from "../../../../Juno/JunoClient";
import { FileSystemUtil } from "../../../Notebook/FileSystemUtil";

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
  public static readonly CARD_HEIGHT = 372;
  public static readonly CARD_WIDTH = 256;

  private static readonly cardImageHeight = 144;
  private static readonly cardDescriptionMaxChars = 80;

  private readonly cardTokens: ICardTokens = {
    childrenMargin: 10,
    childrenGap: 8,
    width: GalleryCardComponent.CARD_WIDTH,
    height: GalleryCardComponent.CARD_HEIGHT
  };

  public render(): JSX.Element {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric"
    };

    const dateString = new Date(this.props.data.created).toLocaleString("default", options);

    return (
      <Card aria-label="Notebook Card" tokens={this.cardTokens} onClick={this.props.onClick}>
        <Card.Item>
          <Persona text={this.props.data.author} secondaryText={dateString} />
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
          <Text variant="small">
            {this.props.data.description.substr(0, GalleryCardComponent.cardDescriptionMaxChars)}
          </Text>
        </Card.Section>

        <Card.Section grow horizontal styles={{ root: { alignItems: "flex-end" } }}>
          <Text variant="tiny" styles={{ root: { color: "#ccc" } }}>
            <Icon iconName="RedEye" styles={{ root: { verticalAlign: "middle" } }} /> {this.props.data.views}
          </Text>
          <Text variant="tiny" styles={{ root: { color: "#ccc" } }}>
            <Icon iconName="Download" styles={{ root: { verticalAlign: "middle" } }} /> {this.props.data.downloads}
          </Text>
          <Text variant="tiny" styles={{ root: { color: "#ccc" } }}>
            <Icon iconName="Heart" styles={{ root: { verticalAlign: "middle" } }} /> {this.props.data.favorites}
          </Text>
        </Card.Section>

        <Card.Section
          fill
          horizontal
          tokens={{ childrenGap: 0 }}
          styles={{ root: { borderTop: "1px solid #F3F2F1", marginLeft: 10, marginRight: 10 } }}
        >
          <Stack horizontal styles={{ root: { display: "contents" } }}>
            <Stack.Item>
              <IconButton
                iconProps={{ iconName: this.props.isFavorite ? "HeartFill" : "Heart" }}
                onClick={this.props.isFavorite ? this.onUnfavoriteClick : this.onFavoriteClick}
              />
            </Stack.Item>

            <Stack.Item>
              <IconButton iconProps={{ iconName: "Download" }} onClick={this.onDownloadClick} />
            </Stack.Item>

            {this.props.showDelete ? (
              <>
                <Stack.Item grow>
                  <></>
                </Stack.Item>

                <Stack.Item>
                  <IconButton iconProps={{ iconName: "Delete" }} onClick={this.onDeleteClick} />
                </Stack.Item>
              </>
            ) : (
              <></>
            )}
          </Stack>
        </Card.Section>
      </Card>
    );
  }

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
