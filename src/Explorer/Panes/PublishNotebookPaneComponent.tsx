import { ITextFieldProps, Stack, Text, TextField, Dropdown, IDropdownProps } from "office-ui-fabric-react";
import * as React from "react";
import { GalleryCardComponent } from "../Controls/NotebookGallery/Cards/GalleryCardComponent";
import { FileSystemUtil } from "../Notebook/FileSystemUtil";
import "./PublishNotebookPaneComponent.less";
import Html2Canvas from "html2canvas";
import { ImmutableNotebook } from "@nteract/commutable/src";
import { ImmutableCodeCell, ImmutableOutput } from "@nteract/commutable";

export interface PublishNotebookPaneProps {
  notebookName: string;
  notebookDescription: string;
  notebookTags: string;
  notebookAuthor: string;
  notebookCreatedDate: string;
  notebookObject: ImmutableNotebook;
  notebookParentDomElement: HTMLElement;
  onChangeDescription: (newValue: string) => void;
  onChangeTags: (newValue: string) => void;
  onChangeImageSrc: (newValue: string) => void;
  onError: (formError: string, formErrorDetail: string, area: string) => void;
  clearFormError: () => void;
}

interface PublishNotebookPaneState {
  type: string;
  notebookDescription: string;
  notebookTags: string;
  imageSrc: string;
}

export class PublishNotebookPaneComponent extends React.Component<PublishNotebookPaneProps, PublishNotebookPaneState> {
  private static readonly maxImageSizeInMib = 1.5;
  private static readonly Url = "URL";
  private static readonly CustomImage = "Custom Image";
  private static readonly TakeScreenshot = "Take Screenshot";
  private static readonly UseFirstDisplayOutput = "Use First Display Output";
  private descriptionPara1: string;
  private descriptionPara2: string;
  private descriptionProps: ITextFieldProps;
  private tagsProps: ITextFieldProps;
  private thumbnailUrlProps: ITextFieldProps;
  private thumbnailSelectorProps: IDropdownProps;
  private imageToBase64: (file: File, updateImageSrc: (result: string) => void) => void;
  private takeScreenshot: (target: HTMLElement, onError: (error: Error) => void) => void;
  private publishPaneRef = React.createRef<HTMLDivElement>();

  constructor(props: PublishNotebookPaneProps) {
    super(props);

    this.state = {
      type: PublishNotebookPaneComponent.Url,
      notebookDescription: "",
      notebookTags: "",
      imageSrc: undefined
    };

    this.imageToBase64 = (file: File, updateImageSrc: (result: string) => void) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function() {
        updateImageSrc(reader.result.toString());
      };

      const onError = this.props.onError;
      reader.onerror = function(error) {
        const formError = `Failed to convert ${file.name} to base64 format`;
        const formErrorDetail = `${error}`;
        const area = "PublishNotebookPaneComponent/selectImageFile";
        onError(formError, formErrorDetail, area);
      };
    };

    this.takeScreenshot = (target: HTMLElement, onError: (error: Error) => void): void => {
      const updateImageSrcWithScreenshot = (canvasUrl: string): void => {
        this.props.onChangeImageSrc(canvasUrl);
        this.setState({ imageSrc: canvasUrl });
      };

      target.scrollIntoView();
      Html2Canvas(target, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: true
      })
        .then(function(canvas) {
          //redraw canvas to fit Card Cover Image dimensions
          const originalImageData = canvas.toDataURL();
          const requiredHeight =
            parseInt(canvas.style.width.split("px")[0]) * GalleryCardComponent.cardHeightToWidthRatio;
          canvas.height = requiredHeight;
          const context = canvas.getContext("2d");
          const image = new Image();
          image.src = originalImageData;
          image.onload = function() {
            context.drawImage(image, 0, 0);
            updateImageSrcWithScreenshot(canvas.toDataURL());
            return;
          };
        })
        .catch(error => {
          onError(error);
        });
    };

    this.descriptionPara1 =
      "This notebook has your data. Please make sure you delete any sensitive data/output before publishing.";

    this.descriptionPara2 = `Would you like to publish and share "${FileSystemUtil.stripExtension(
      this.props.notebookName,
      "ipynb"
    )}" to the gallery?`;

    this.thumbnailUrlProps = {
      label: "Cover image url",
      ariaLabel: "Cover image url",
      onChange: (event, newValue) => {
        this.props.onChangeImageSrc(newValue);
        this.setState({ imageSrc: newValue });
      }
    };

    const screenshotErrorHandler = (error: Error) => {
      const formError = "Failed to take screen shot";
      const formErrorDetail = `${error}`;
      const area = "PublishNotebookPaneComponent/takeScreenshot";
      this.props.onError(formError, formErrorDetail, area);
    };

    const firstOutputErrorHandler = (error: Error) => {
      const formError = "Failed to capture first output";
      const formErrorDetail = `${error}`;
      const area = "PublishNotebookPaneComponent/UseFirstOutput";
      this.props.onError(formError, formErrorDetail, area);
    };

    this.thumbnailSelectorProps = {
      label: "Cover image",
      defaultSelectedKey: PublishNotebookPaneComponent.Url,
      ariaLabel: "Cover image",
      options: [
        PublishNotebookPaneComponent.Url,
        PublishNotebookPaneComponent.CustomImage,
        PublishNotebookPaneComponent.TakeScreenshot,
        PublishNotebookPaneComponent.UseFirstDisplayOutput
      ].map((value: string) => ({ text: value, key: value })),
      onChange: (event, options) => {
        this.props.clearFormError();
        if (options.text === PublishNotebookPaneComponent.TakeScreenshot) {
          try {
            this.takeScreenshot(this.props.notebookParentDomElement, screenshotErrorHandler);
          } catch (error) {
            screenshotErrorHandler(error);
          }
        } else if (options.text === PublishNotebookPaneComponent.UseFirstDisplayOutput) {
          try {
            this.takeScreenshot(this.findFirstOutput(), firstOutputErrorHandler);
          } catch (error) {
            firstOutputErrorHandler(error);
          }
        }
        this.setState({ type: options.text });
      }
    };

    this.descriptionProps = {
      label: "Description",
      ariaLabel: "Description",
      multiline: true,
      rows: 3,
      required: true,
      onChange: (event, newValue) => {
        this.props.onChangeDescription(newValue);
        this.setState({ notebookDescription: newValue });
      }
    };

    this.tagsProps = {
      label: "Tags",
      ariaLabel: "Tags",
      placeholder: "Optional tag 1, Optional tag 2",
      onChange: (event, newValue) => {
        this.props.onChangeTags(newValue);
        this.setState({ notebookTags: newValue });
      }
    };
  }

  private renderThumbnailSelectors(type: string) {
    switch (type) {
      case PublishNotebookPaneComponent.Url:
        return <TextField {...this.thumbnailUrlProps} />;
      case PublishNotebookPaneComponent.CustomImage:
        return (
          <input
            id="selectImageFile"
            type="file"
            accept="image/*"
            onChange={event => {
              const file = event.target.files[0];
              if (file.size / 1024 ** 2 > PublishNotebookPaneComponent.maxImageSizeInMib) {
                event.target.value = "";
                const formError = `Failed to upload ${file.name}`;
                const formErrorDetail = `Image is larger than ${PublishNotebookPaneComponent.maxImageSizeInMib} MiB. Please Choose a different image.`;
                const area = "PublishNotebookPaneComponent/selectImageFile";

                this.props.onError(formError, formErrorDetail, area);
                this.props.onChangeImageSrc(undefined);
                this.setState({ imageSrc: undefined });
                return;
              } else {
                this.props.clearFormError();
              }
              this.imageToBase64(file, (result: string) => {
                this.props.onChangeImageSrc(result);
                this.setState({ imageSrc: result });
              });
            }}
          />
        );
      default:
        return <></>;
    }
  }

  private findFirstOutput(): HTMLElement {
    const indexOfFirstCodeCellWithDisplay = this.findFirstCodeCellWithDisplay();
    const cellOutputDomElements = this.props.notebookParentDomElement.querySelectorAll<HTMLElement>(
      ".nteract-cell-outputs"
    );
    return cellOutputDomElements[indexOfFirstCodeCellWithDisplay];
  }

  private findFirstCodeCellWithDisplay(): number {
    let codeCellCount = -1;
    for (let i = 0; i < this.props.notebookObject.cellOrder.size; i++) {
      const cellId = this.props.notebookObject.cellOrder.get(i);
      const cell = this.props.notebookObject.cellMap.get(cellId);
      if (cell.cell_type === "code") {
        codeCellCount++;
        const codeCell = cell as ImmutableCodeCell;
        if (codeCell.outputs) {
          const displayOutput = codeCell.outputs.find((output: ImmutableOutput) => {
            if (output.output_type === "display_data" || output.output_type === "execute_result") {
              return true;
            }
            return false;
          });
          if (displayOutput) {
            return codeCellCount;
          }
        }
      }
    }

    throw new Error("Output does not exist for any of the cells.");
  }

  public render(): JSX.Element {
    return (
      <div className="publishNotebookPanelContent" ref={this.publishPaneRef}>
        <Stack className="panelMainContent" tokens={{ childrenGap: 20 }}>
          <Stack.Item>
            <Text>{this.descriptionPara1}</Text>
          </Stack.Item>

          <Stack.Item>
            <Text>{this.descriptionPara2}</Text>
          </Stack.Item>

          <Stack.Item>
            <TextField {...this.descriptionProps} />
          </Stack.Item>

          <Stack.Item>
            <TextField {...this.tagsProps} />
          </Stack.Item>

          <Stack.Item>
            <Dropdown {...this.thumbnailSelectorProps} />
          </Stack.Item>

          <Stack.Item>{this.renderThumbnailSelectors(this.state.type)}</Stack.Item>

          <Stack.Item>
            <Text>Preview</Text>
          </Stack.Item>
          <Stack.Item>
            <GalleryCardComponent
              data={{
                id: undefined,
                name: this.props.notebookName,
                description: this.state.notebookDescription,
                gitSha: undefined,
                tags: this.state.notebookTags.split(","),
                author: this.props.notebookAuthor,
                thumbnailUrl: this.state.imageSrc,
                created: this.props.notebookCreatedDate,
                isSample: false,
                downloads: 0,
                favorites: 0,
                views: 0
              }}
              isFavorite={false}
              showDownload={true}
              showDelete={true}
              onClick={undefined}
              onTagClick={undefined}
              onFavoriteClick={undefined}
              onUnfavoriteClick={undefined}
              onDownloadClick={undefined}
              onDeleteClick={undefined}
            />
          </Stack.Item>
        </Stack>
      </div>
    );
  }
}
