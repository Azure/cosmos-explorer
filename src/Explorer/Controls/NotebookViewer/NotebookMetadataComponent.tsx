/**
 * Wrapper around Notebook metadata
 */
import {
  FontWeights,
  Icon,
  IconButton,
  Link,
  Persona,
  PersonaSize,
  PrimaryButton,
  Stack,
  Text,
} from "office-ui-fabric-react";
import * as React from "react";
import { IGalleryItem } from "../../../Juno/JunoClient";
import { FileSystemUtil } from "../../Notebook/FileSystemUtil";
import "./NotebookViewerComponent.less";

export interface NotebookMetadataComponentProps {
  data: IGalleryItem;
  isFavorite: boolean;
  downloadButtonText: string;
  onTagClick: (tag: string) => void;
  onFavoriteClick: () => void;
  onUnfavoriteClick: () => void;
  onDownloadClick: () => void;
}

export class NotebookMetadataComponent extends React.Component<NotebookMetadataComponentProps> {
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
          <Text variant="xxLarge" nowrap>
            {FileSystemUtil.stripExtension(this.props.data.name, "ipynb")}
          </Text>
          <Text>
            <IconButton
              iconProps={{ iconName: this.props.isFavorite ? "HeartFill" : "Heart" }}
              onClick={this.props.isFavorite ? this.props.onUnfavoriteClick : this.props.onFavoriteClick}
            />
            {this.props.data.favorites} likes
          </Text>
          <PrimaryButton text={this.props.downloadButtonText} onClick={this.props.onDownloadClick} />
        </Stack>

        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
          <Persona text={this.props.data.author} size={PersonaSize.size32} />
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
