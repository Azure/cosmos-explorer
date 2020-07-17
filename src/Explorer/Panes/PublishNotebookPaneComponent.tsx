import { ITextFieldProps, Stack, Text, TextField, Dropdown, IDropdownProps, Button } from "office-ui-fabric-react";
import * as React from "react";
import { GalleryCardComponent } from "../Controls/NotebookGallery/Cards/GalleryCardComponent";
import { FileSystemUtil } from "../Notebook/FileSystemUtil";
import "./PublishNotebookPaneComponent.less";

export interface PublishNotebookPaneProps {
  notebookName: string;
  notebookDescription: string;
  notebookTags: string;
  notebookAuthor: string;
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
  private readonly maxImageSizeInMib = 1.5;
  private readonly ImageTypes = ["URL", "Custom Image"];
  private descriptionPara1: string;
  private descriptionPara2: string;
  private descriptionProps: ITextFieldProps;
  private tagsProps: ITextFieldProps;
  private thumbnailUrlProps: ITextFieldProps;
  private thumbnailSelectorProps: IDropdownProps;
  private dateString: string;
  private imageToBase64: (file: File, updateImageSrc: (result: string) => void) => void;

  constructor(props: PublishNotebookPaneProps) {
    super(props);

    this.state = {
      type: this.ImageTypes[0],
      notebookDescription: "",
      notebookTags: "",
      imageSrc: undefined
    };

    this.imageToBase64 = (file: File, updateImageSrc: (result: string) => void) => {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function() {
        updateImageSrc(reader.result.toString());
      };

      const onError = this.props.onError;
      reader.onerror = function(error) {
        const formError = `Failed to convert ${file.name} to base64 format`;
        const formErrorDetail = `${error}`;
        const area = "PublishNotebookPaneComponent/selectImageFile";
        onError(formErrorDetail, formErrorDetail, area);
      };
    };

    this.descriptionPara1 =
      "This notebook has your data. Please make sure you delete any sensitive data/output before publishing.";

    this.descriptionPara2 = `Would you like to publish and share ${FileSystemUtil.stripExtension(
      this.props.notebookName,
      "ipynb"
    )} to the gallery?`;

    this.thumbnailUrlProps = {
      label: "Cover image url",
      ariaLabel: "Cover image url",
      onChange: (event, newValue) => {
        this.props.onChangeImageSrc(newValue);
        this.setState({ imageSrc: newValue });
      }
    };

    this.thumbnailSelectorProps = {
      label: "Cover image",
      defaultSelectedKey: this.ImageTypes[0],
      ariaLabel: "Cover image",
      options: this.ImageTypes.map((value: string) => {
        return { text: value, key: value };
      }),
      onChange: (event, options) => {
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

    this.dateString = new Date().toISOString();
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
            <TextField {...this.descriptionProps} />
          </Stack.Item>

          <Stack.Item>
            <TextField {...this.tagsProps} />
          </Stack.Item>

          <Stack.Item>
            <Dropdown {...this.thumbnailSelectorProps} />
          </Stack.Item>

          {this.state.type === this.ImageTypes[0] ? (
            <Stack.Item>
              <TextField {...this.thumbnailUrlProps} />
            </Stack.Item>
          ) : (
            <Stack.Item>
              <input
                id="selectImageFile"
                type="file"
                accept="image/*"
                onChange={event => {
                  const file = event.target.files[0];
                  if (file.size / 1024 ** 2 > this.maxImageSizeInMib) {
                    event.target.value = null;
                    const formError = `Failed to upload ${file.name}`;
                    const formErrorDetail = `Image is larger than ${this.maxImageSizeInMib} MiB. Please Choose a different image.`;
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
            </Stack.Item>
          )}
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
                created: this.dateString,
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
