import { ITextFieldProps, Stack, Text, TextField, Dropdown, IDropdownProps } from "office-ui-fabric-react";
import * as React from "react";
import { GalleryCardComponent } from "../Controls/NotebookGallery/Cards/GalleryCardComponent";
import { FileSystemUtil } from "../Notebook/FileSystemUtil";
import "./PublishNotebookPaneComponent.less";
import Html2Canvas from "html2canvas";
import { ImmutableNotebook } from "@nteract/commutable/src";
import { NotebookUtil } from "../Notebook/NotebookUtil";

export interface PublishNotebookPaneProps {
  notebookName: string;
  notebookDescription: string;
  notebookTags: string;
  notebookAuthor: string;
  notebookCreatedDate: string;
  notebookObject: ImmutableNotebook;
  notebookParentDomElement: HTMLElement;
  onChangeName: (newValue: string) => void;
  onChangeDescription: (newValue: string) => void;
  onChangeTags: (newValue: string) => void;
  onChangeImageSrc: (newValue: string) => void;
  onError: (formError: string, formErrorDetail: string, area: string) => void;
  clearFormError: () => void;
}

interface PublishNotebookPaneState {
  type: string;
  notebookName: string;
  notebookDescription: string;
  notebookTags: string;
  imageSrc: string;
}

enum ImageTypes {
  Url = "URL",
  CustomImage = "Custom Image",
  TakeScreenshot = "Take Screenshot",
  UseFirstDisplayOutput = "Use First Display Output"
}

export class PublishNotebookPaneComponent extends React.Component<PublishNotebookPaneProps, PublishNotebookPaneState> {
  private static readonly maxImageSizeInMib = 1.5;
  private descriptionPara1: string;
  private descriptionPara2: string;
  private nameProps: ITextFieldProps;
  private descriptionProps: ITextFieldProps;
  private tagsProps: ITextFieldProps;
  private thumbnailUrlProps: ITextFieldProps;
  private thumbnailSelectorProps: IDropdownProps;
  private imageToBase64: (file: File, updateImageSrc: (result: string) => void) => void;
  private takeScreenshot: (target: HTMLElement, onError: (error: Error) => void) => void;

  constructor(props: PublishNotebookPaneProps) {
    super(props);

    this.state = {
      type: ImageTypes.Url,
      notebookName: props.notebookName,
      notebookDescription: "",
      notebookTags: "",
      imageSrc: undefined
    };

    this.imageToBase64 = (file: File, updateImageSrc: (result: string) => void) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        updateImageSrc(reader.result.toString());
      };

      const onError = this.props.onError;
      reader.onerror = error => {
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
        .then(canvas => {
          //redraw canvas to fit Card Cover Image dimensions
          const originalImageData = canvas.toDataURL();
          const requiredHeight =
            parseInt(canvas.style.width.split("px")[0]) * GalleryCardComponent.cardHeightToWidthRatio;
          canvas.height = requiredHeight;
          const context = canvas.getContext("2d");
          const image = new Image();
          image.src = originalImageData;
          image.onload = () => {
            context.drawImage(image, 0, 0);
            updateImageSrcWithScreenshot(canvas.toDataURL());
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
      defaultSelectedKey: ImageTypes.Url,
      ariaLabel: "Cover image",
      options: [
        ImageTypes.Url,
        ImageTypes.CustomImage,
        ImageTypes.TakeScreenshot,
        ImageTypes.UseFirstDisplayOutput
      ].map((value: string) => ({ text: value, key: value })),
      onChange: async (event, options) => {
        this.props.clearFormError();
        if (options.text === ImageTypes.TakeScreenshot) {
          try {
            await this.takeScreenshot(this.props.notebookParentDomElement, screenshotErrorHandler);
          } catch (error) {
            screenshotErrorHandler(error);
          }
        } else if (options.text === ImageTypes.UseFirstDisplayOutput) {
          try {
            await this.takeScreenshot(this.findFirstOutput(), firstOutputErrorHandler);
          } catch (error) {
            firstOutputErrorHandler(error);
          }
        }
        this.setState({ type: options.text });
      }
    };

    this.nameProps = {
      label: "Name",
      ariaLabel: "Name",
      defaultValue: this.props.notebookName,
      required: true,
      onChange: (event, newValue) => {
        this.props.onChangeName(newValue);
        this.setState({ notebookName: newValue });
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
      case ImageTypes.Url:
        return <TextField {...this.thumbnailUrlProps} />;
      case ImageTypes.CustomImage:
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
    const indexOfFirstCodeCellWithDisplay = NotebookUtil.findFirstCodeCellWithDisplay(this.props.notebookObject);
    const cellOutputDomElements = this.props.notebookParentDomElement.querySelectorAll<HTMLElement>(
      ".nteract-cell-outputs"
    );
    return cellOutputDomElements[indexOfFirstCodeCellWithDisplay];
  }

  public render(): JSX.Element {
    return (
      <div className="publishNotebookPanelContent">
        <Stack className="panelMainContent" tokens={{ childrenGap: 20 }}>
          <Stack.Item>
            <Text>{this.descriptionPara1}</Text>
          </Stack.Item>

          <Stack.Item>
            <Text>{this.descriptionPara2}</Text>
          </Stack.Item>

          <Stack.Item>
            <TextField {...this.nameProps} />
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
                views: 0,
                newCellId: undefined
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
