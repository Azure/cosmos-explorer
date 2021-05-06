/**
 * Wrapper around Notebook metadata
 */
import { FontWeights, Icon, IconButton, Link, Persona, PersonaSize, PrimaryButton, Stack, Text } from "@fluentui/react";
import CosmosDBLogo from "images/CosmosDB-logo.svg";
import * as React from "react";
import { IGalleryItem } from "../../../Juno/JunoClient";
import * as FileSystemUtil from "../../Notebook/FileSystemUtil";
import { InfoComponent } from "../NotebookGallery/InfoComponent/InfoComponent";
import "./NotebookViewerComponent.less";

export interface NotebookMetadataComponentProps {
  data: IGalleryItem;
  isFavorite: boolean;
  downloadButtonText?: string;
  onTagClick: (tag: string) => void;
  onFavoriteClick: () => void;
  onUnfavoriteClick: () => void;
  onDownloadClick: () => void;
  onReportAbuseClick: () => void;
}

export class NotebookMetadataComponent extends React.Component<NotebookMetadataComponentProps> {
  private renderFavouriteButton = (): JSX.Element => {
    return (
      <Text>
        {this.props.isFavorite !== undefined ? (
          <>
            <IconButton
              iconProps={{ iconName: this.props.isFavorite ? "HeartFill" : "Heart" }}
              onClick={this.props.isFavorite ? this.props.onUnfavoriteClick : this.props.onFavoriteClick}
            />
            {this.props.data.favorites} likes
          </>
        ) : (
          <>
            <Icon iconName="Heart" /> {this.props.data.favorites} likes
          </>
        )}
      </Text>
    );
  };

  public render(): JSX.Element {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    const dateString = new Date(this.props.data.created).toLocaleString("default", options);

    return (
      <Stack tokens={{ childrenGap: 10 }}>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 30 }}>
          <Stack.Item>
            <Text variant="xxLarge" nowrap>
              {FileSystemUtil.stripExtension(this.props.data.name, "ipynb")}
            </Text>
          </Stack.Item>

          <Stack.Item>{this.renderFavouriteButton()}</Stack.Item>

          {this.props.downloadButtonText && (
            <Stack.Item>
              <PrimaryButton text={this.props.downloadButtonText} onClick={this.props.onDownloadClick} />
            </Stack.Item>
          )}

          <Stack.Item grow>
            <></>
          </Stack.Item>

          <Stack.Item>
            <InfoComponent onReportAbuseClick={this.props.onReportAbuseClick} />
          </Stack.Item>
        </Stack>

        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
          <Persona
            imageUrl={this.props.data.isSample && CosmosDBLogo}
            text={this.props.data.author}
            size={PersonaSize.size32}
          />
          <Text>{dateString}</Text>
          <Text>
            <Icon iconName="RedEye" /> {this.props.data.views}
          </Text>
          <Text>
            <Icon iconName="Download" />
            {this.props.data.downloads}
          </Text>
        </Stack>

        <Text nowrap>
          {this.props.data.tags?.map((tag, index, array) => (
            <span key={tag}>
              <Link onClick={(): void => this.props.onTagClick(tag)}>{tag}</Link>
              {index === array.length - 1 ? <></> : ", "}
            </span>
          ))}
        </Text>

        <Text variant="large" styles={{ root: { fontWeight: FontWeights.semibold } }}>
          Description
        </Text>

        <Text>{this.props.data.description}</Text>
      </Stack>
    );
  }
}
