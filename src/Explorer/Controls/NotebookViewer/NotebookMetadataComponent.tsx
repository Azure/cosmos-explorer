/**
 * Wrapper around Notebook metadata
 */

import * as React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { NotebookMetadata } from "../../../Contracts/DataModels";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import { Icon, Persona, Text } from "office-ui-fabric-react";
import CSS from "csstype";
import {
  siteTextStyles,
  subtleIconStyles,
  iconStyles,
  mainHelpfulTextStyles,
  subtleHelpfulTextStyles,
  helpfulTextStyles
} from "../../../GalleryViewer/Cards/CardStyleConstants";

initializeIcons();

interface NotebookMetadataComponentProps {
  notebookName: string;
  container: ViewModels.Explorer;
  notebookMetadata: NotebookMetadata;
  notebookContent: any;
}

export class NotebookMetadataComponent extends React.Component<NotebookMetadataComponentProps> {
  private inlineBlockStyle: CSS.Properties = {
    display: "inline-block"
  };

  private marginTopStyle: CSS.Properties = {
    marginTop: "5px"
  };

  private onDownloadClick: (newNotebookName: string) => void = (newNotebookName: string) => {
    this.props.container.importAndOpenFromGallery(
      this.props.notebookName,
      newNotebookName,
      JSON.stringify(this.props.notebookContent)
    );
  };

  public render(): JSX.Element {
    const promptForNotebookName = () => {
      return new Promise<string>((resolve, reject) => {
        var newNotebookName = this.props.notebookName;
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

    return (
      <div className="notebookViewerMetadataContainer">
        <h3 style={this.inlineBlockStyle}>{this.props.notebookName}</h3>

        {this.props.notebookMetadata && (
          <div style={this.inlineBlockStyle}>
            <Icon iconName="Heart" styles={iconStyles} />
            <Text variant="medium" styles={mainHelpfulTextStyles}>
              {this.props.notebookMetadata.likes} likes
            </Text>
          </div>
        )}

        {this.props.container && (
          <button
            aria-label="downloadButton"
            className="downloadButton"
            onClick={async () => {
              promptForNotebookName().then(this.onDownloadClick);
            }}
          >
            Download Notebook
          </button>
        )}

        {this.props.notebookMetadata && (
          <>
            <div>
              <Persona
                style={this.inlineBlockStyle}
                text={this.props.notebookMetadata.author}
                secondaryText={this.props.notebookMetadata.date}
              />
            </div>
            <div>
              <div style={this.marginTopStyle}>
                <Icon iconName="RedEye" styles={subtleIconStyles} />
                <Text variant="small" styles={subtleHelpfulTextStyles}>
                  {this.props.notebookMetadata.views}
                </Text>
                <Icon iconName="Download" styles={subtleIconStyles} />
                <Text variant="small" styles={subtleHelpfulTextStyles}>
                  {this.props.notebookMetadata.downloads}
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
