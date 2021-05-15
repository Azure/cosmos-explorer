import {
  BaseButton,
  Button,
  DocumentCard,
  DocumentCardActivity,
  DocumentCardDetails,
  DocumentCardPreview,
  DocumentCardTitle,
  Icon,
  IconButton,
  IDocumentCardPreviewProps,
  IDocumentCardStyles,
  ImageFit,
  Link,
  Separator,
  Spinner,
  SpinnerSize,
  Text,
  TooltipHost,
} from "@fluentui/react";
import React, { FunctionComponent, useState } from "react";
import CosmosDBLogo from "../../../../../images/CosmosDB-logo.svg";
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

  const renderTruncated = (text: string, totalLength: number): string => {
    let truncatedDescription = text.substr(0, totalLength);
    if (text.length > totalLength) {
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
  const DocumentCardActivityPeople = [{ name: data.author, profileImageSrc: data.isSample && CosmosDBLogo }];
  const previewProps: IDocumentCardPreviewProps = {
    previewImages: [
      {
        previewImageSrc: data.thumbnailUrl,
        imageFit: ImageFit.cover,
        width: CARD_WIDTH,
        height: cardImageHeight,
      },
    ],
  };
  const cardStyles: IDocumentCardStyles = {
    root: { display: "inline-block", marginRight: 20, width: CARD_WIDTH },
  };
  return (
    <DocumentCard aria-label={cardTitle} styles={cardStyles} onClick={onClick}>
      {isDeletingPublishedNotebook && (
        <Spinner
          size={SpinnerSize.large}
          label={`Deleting '${cardTitle}'`}
          styles={{ root: { height: cardDeleteSpinnerHeight } }}
        />
      )}
      {!isDeletingPublishedNotebook && (
        <>
          <DocumentCardActivity activity={dateString} people={DocumentCardActivityPeople} />
          <DocumentCardPreview {...previewProps} />
          <DocumentCardDetails>
            <Text variant="small" nowrap styles={{ root: { height: smallTextLineHeight, padding: "2px 16px" } }}>
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
            <DocumentCardTitle title={renderTruncated(cardTitle, 20)} shouldTruncate />
            <DocumentCardTitle
              title={renderTruncated(data.description, cardDescriptionMaxChars)}
              showAsSecondaryTitle
            />
            <span style={{ padding: "8px 16px" }}>
              {data.views !== undefined && generateIconText("RedEye", data.views.toString())}
              {data.downloads !== undefined && generateIconText("Download", data.downloads.toString())}
              {data.favorites !== undefined && generateIconText("Heart", data.favorites.toString())}
            </span>
          </DocumentCardDetails>
          {cardButtonsVisible && (
            <DocumentCardDetails>
              <Separator styles={{ root: { padding: 0, height: 1 } }} />

              <span style={{ padding: "0px 16px" }}>
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
            </DocumentCardDetails>
          )}
        </>
      )}
    </DocumentCard>
  );
};
