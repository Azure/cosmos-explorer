/**
 * Wrapper around Notebook metadata
 */

import * as React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { NotebookMetadata } from "../../../Contracts/DataModels";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import { Icon, Persona, Text, IconButton } from "office-ui-fabric-react";
import {
  siteTextStyles,
  subtleIconStyles,
  iconStyles,
  iconButtonStyles,
  mainHelpfulTextStyles,
  subtleHelpfulTextStyles,
  helpfulTextStyles
} from "../NotebookGallery/Cards/CardStyleConstants";

import "./NotebookViewerComponent.less";

initializeIcons();

export interface NotebookMetadataComponentProps {
  notebookName: string;
  container: ViewModels.Explorer;
  notebookMetadata: NotebookMetadata;
  notebookContent: any;
  onNotebookMetadataChange: (newNotebookMetadata: NotebookMetadata) => Promise<void>;
  isLikedNotebook: boolean;
}

interface NotebookMetadatComponentState {
  liked: boolean;
  notebookMetadata: NotebookMetadata;
}

export class NotebookMetadataComponent extends React.Component<
  NotebookMetadataComponentProps,
  NotebookMetadatComponentState
> {
  constructor(props: NotebookMetadataComponentProps) {
    super(props);
    this.state = {
      liked: this.props.isLikedNotebook,
      notebookMetadata: this.props.notebookMetadata
    };
  }

  private onDownloadClick = (newNotebookName: string) => {
    this.props.container
      .importAndOpenFromGallery(this.props.notebookName, newNotebookName, JSON.stringify(this.props.notebookContent))
      .then(() => {
        if (this.props.notebookMetadata) {
          if (this.props.onNotebookMetadataChange) {
            const notebookMetadata = { ...this.state.notebookMetadata };
            notebookMetadata.downloads += 1;
            this.props.onNotebookMetadataChange(notebookMetadata).then(() => {
              this.setState({ notebookMetadata: notebookMetadata });
            });
          }
        }
      });
  };

  componentDidMount() {
    if (this.props.onNotebookMetadataChange) {
      const notebookMetadata = { ...this.state.notebookMetadata };
      if (this.props.notebookMetadata) {
        notebookMetadata.views += 1;
        this.props.onNotebookMetadataChange(notebookMetadata).then(() => {
          this.setState({ notebookMetadata: notebookMetadata });
        });
      }
    }
  }

  private onLike = (): void => {
    if (this.props.onNotebookMetadataChange) {
      const notebookMetadata = { ...this.state.notebookMetadata };
      let liked: boolean;
      if (this.state.liked) {
        liked = false;
        notebookMetadata.likes -= 1;
      } else {
        liked = true;
        notebookMetadata.likes += 1;
      }

      this.props.onNotebookMetadataChange(notebookMetadata).then(() => {
        this.setState({ liked: liked, notebookMetadata: notebookMetadata });
      });
    }
  };

  private onDownload = (): void => {
    const promptForNotebookName = () => {
      return new Promise<string>((resolve, reject) => {
        let newNotebookName = this.props.notebookName;
        this.props.container.showOkCancelTextFieldModalDialog(
          "Save notebook as",
          undefined,
          "Ok",
          () => resolve(newNotebookName),
          "Cancel",
          () => reject(new Error("New notebook name dialog canceled")),
          {
            label: "New notebook name:",
            autoAdjustHeight: true,
            multiline: true,
            rows: 3,
            defaultValue: this.props.notebookName,
            onChange: (_, newValue: string) => {
              newNotebookName = newValue;
            }
          }
        );
      });
    };

    promptForNotebookName().then((newNotebookName: string) => {
      this.onDownloadClick(newNotebookName);
    });
  };

  public render(): JSX.Element {
    return (
      <div className="notebookViewerMetadataContainer">
        <h3 className="title">{this.props.notebookName}</h3>

        {this.props.notebookMetadata && (
          <div className="decoration">
            {this.props.container ? (
              <IconButton
                iconProps={{ iconName: this.state.liked ? "HeartFill" : "Heart" }}
                styles={iconButtonStyles}
                onClick={this.onLike}
              />
            ) : (
              <Icon iconName="Heart" styles={iconStyles} />
            )}
            <Text variant="large" styles={mainHelpfulTextStyles}>
              {this.state.notebookMetadata.likes} likes
            </Text>
          </div>
        )}

        {this.props.container && (
          <button aria-label="downloadButton" className="downloadButton" onClick={this.onDownload}>
            Download Notebook
          </button>
        )}

        {this.props.notebookMetadata && (
          <>
            <div>
              <Persona
                className="persona"
                text={this.props.notebookMetadata.author}
                secondaryText={this.props.notebookMetadata.date}
              />
            </div>
            <div>
              <div className="extras">
                <Icon iconName="RedEye" styles={subtleIconStyles} />
                <Text variant="small" styles={subtleHelpfulTextStyles}>
                  {this.state.notebookMetadata.views}
                </Text>
                <Icon iconName="Download" styles={subtleIconStyles} />
                <Text variant="small" styles={subtleHelpfulTextStyles}>
                  {this.state.notebookMetadata.downloads}
                </Text>
              </div>
              <Text variant="small" styles={siteTextStyles}>
                {this.props.notebookMetadata.tags.join(", ")}
              </Text>
            </div>
            <div>
              <Text variant="small" styles={helpfulTextStyles}>
                <b>Description:</b>
                <p>{this.props.notebookMetadata.description}</p>
              </Text>
            </div>
          </>
        )}
      </div>
    );
  }
}
