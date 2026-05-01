/**
 * Wrapper around Notebook metadata
 */
import { FontWeights, Icon, Link, Persona, PersonaSize, Stack, Text } from "@fluentui/react";
import * as React from "react";
import { IGalleryItem } from "../../../Juno/JunoClient";
import * as FileSystemUtil from "../../Notebook/FileSystemUtil";
import "./NotebookViewerComponent.less";
import CosmosDBLogo from "../../../../images/CosmosDB-logo.svg";

export interface NotebookMetadataComponentProps {
  data: IGalleryItem;
  isFavorite: boolean;
  downloadButtonText?: string;
  onTagClick: (tag: string) => void;
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
          <Stack.Item>
            <Text variant="xxLarge" nowrap>
              {FileSystemUtil.stripExtension(this.props.data.name, "ipynb")}
            </Text>
          </Stack.Item>

          <Stack.Item>
            <Text>
              <Icon iconName="Heart" /> {this.props.data.favorites} likes
            </Text>
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
