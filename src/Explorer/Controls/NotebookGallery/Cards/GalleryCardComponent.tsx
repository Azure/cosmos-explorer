import {
  BaseButton,
  Button,
  FontWeights,
  Icon,
  IconButton,
  Image,
  ImageFit,
  Link,
  Persona,
  Separator,
  Spinner,
  SpinnerSize,
  Text,
  TooltipHost,
} from "@fluentui/react";
import { Card } from "@uifabric/react-cards";
import CosmosDBLogo from "images/CosmosDB-logo.svg";
import React, { FunctionComponent, useState } from "react";
import { IGalleryItem } from "../../../../Juno/JunoClient";
import * as FileSystemUtil from "../../../Notebook/FileSystemUtil";

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
  onDeleteClick: (beforeDelete: () => void, afterDelete: () => void) => void;
}

export const GalleryCardComponent: FunctionComponent<GalleryCardComponentProps> = ({
  data,
  isFavorite,
  showDownload,
  showDelete,
  onClick,
  onTagClick,
  onFavoriteClick,
  onUnfavoriteClick,
  onDownloadClick,
  onDeleteClick,
}: GalleryCardComponentProps) => {
  const CARD_WIDTH = 256;
  const cardImageHeight = 144;
  const cardDescriptionMaxChars = 80;
  const cardItemGapBig = 10;
  const cardItemGapSmall = 8;
  const cardDeleteSpinnerHeight = 360;
  const smallTextLineHeight = 18;

  const [isDeletingPublishedNotebook, setIsDeletingPublishedNotebook] = useState<boolean>(false);

  const cardButtonsVisible = isFavorite !== undefined || showDownload || showDelete;
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const dateString = new Date(data.created).toLocaleString("default", options);
  const cardTitle = FileSystemUtil.stripExtension(data.name, "ipynb");

  const renderTruncatedDescription = (): string => {
    let truncatedDescription = data.description.substr(0, cardDescriptionMaxChars);
    if (data.description.length > cardDescriptionMaxChars) {
      truncatedDescription = `${truncatedDescription} ...`;
    }
    return truncatedDescription;
  };

  const generateIconText = (iconName: string, text: string): JSX.Element => {
    return (
      <Text variant="tiny" styles={{ root: { color: "#605E5C", paddingRight: cardItemGapSmall } }}>
        <Icon iconName={iconName} styles={{ root: { verticalAlign: "middle" } }} /> {text}
      </Text>
    );
  };

  /*
   * Fluent UI doesn't support tooltips on IconButtons out of the box. In the meantime the recommendation is
   * to do the following (from https://developer.microsoft.com/en-us/fluentui#/controls/web/button)
   */
  const generateIconButtonWithTooltip = (
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
          onClick={(event) => handlerOnClick(event, activate)}
        />
      </TooltipHost>
    );
  };

  const handlerOnClick = (
    event:
      | React.MouseEvent<HTMLElement | HTMLAnchorElement | HTMLButtonElement | MouseEvent>
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

  return (
    <Card
      style={{ background: "white" }}
      aria-label={cardTitle}
      data-is-focusable="true"
      tokens={{ width: CARD_WIDTH, childrenGap: 0 }}
      onClick={(event) => handlerOnClick(event, onClick)}
    >
      {isDeletingPublishedNotebook && (
        <Card.Item tokens={{ padding: cardItemGapBig }}>
          <Spinner
            size={SpinnerSize.large}
            label={`Deleting '${cardTitle}'`}
            styles={{ root: { height: cardDeleteSpinnerHeight } }}
          />
        </Card.Item>
      )}
      {!isDeletingPublishedNotebook && (
        <>
          <Card.Item tokens={{ padding: cardItemGapBig }}>
            <Persona imageUrl={data.isSample && CosmosDBLogo} text={data.author} secondaryText={dateString} />
          </Card.Item>

          <Card.Item>
            <Image
              src={data.thumbnailUrl}
              width={CARD_WIDTH}
              height={cardImageHeight}
              imageFit={ImageFit.cover}
              alt={`${cardTitle} cover image`}
            />
          </Card.Item>

          <Card.Section styles={{ root: { padding: cardItemGapBig } }}>
            <Text variant="small" nowrap styles={{ root: { height: smallTextLineHeight } }}>
              {data.tags ? (
                data.tags.map((tag, index, array) => (
                  <span key={tag}>
                    <Link onClick={(event) => handlerOnClick(event, () => onTagClick(tag))}>{tag}</Link>
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
                  paddingTop: cardItemGapSmall,
                  paddingBottom: cardItemGapSmall,
                },
              }}
              nowrap
            >
              {cardTitle}
            </Text>

            <Text variant="small" styles={{ root: { height: smallTextLineHeight * 2 } }}>
              {renderTruncatedDescription()}
            </Text>

            <span>
              {data.views !== undefined && generateIconText("RedEye", data.views.toString())}
              {data.downloads !== undefined && generateIconText("Download", data.downloads.toString())}
              {data.favorites !== undefined && generateIconText("Heart", data.favorites.toString())}
            </span>
          </Card.Section>

          {cardButtonsVisible && (
            <Card.Section
              styles={{
                root: {
                  marginLeft: cardItemGapBig,
                  marginRight: cardItemGapBig,
                },
              }}
            >
              <Separator styles={{ root: { padding: 0, height: 1 } }} />

              <span>
                {isFavorite !== undefined &&
                  generateIconButtonWithTooltip(
                    isFavorite ? "HeartFill" : "Heart",
                    isFavorite ? "Unfavorite" : "Favorite",
                    "left",
                    isFavorite ? onUnfavoriteClick : onFavoriteClick
                  )}

                {showDownload && generateIconButtonWithTooltip("Download", "Download", "left", onDownloadClick)}

                {showDelete &&
                  generateIconButtonWithTooltip("Delete", "Remove", "right", () =>
                    onDeleteClick(
                      () => setIsDeletingPublishedNotebook(true),
                      () => setIsDeletingPublishedNotebook(false)
                    )
                  )}
              </span>
            </Card.Section>
          )}
        </>
      )}
    </Card>
  );
};
