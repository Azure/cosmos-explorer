import { Dropdown, IDropdownProps, ITextFieldProps, Stack, Text, TextField } from "@fluentui/react";
import { ImmutableNotebook } from "@nteract/commutable";
import React, { FunctionComponent, useState } from "react";
import { GalleryCardComponent } from "../../Controls/NotebookGallery/Cards/GalleryCardComponent";
import * as FileSystemUtil from "../../Notebook/FileSystemUtil";
import { SnapshotRequest } from "../../Notebook/NotebookComponent/types";
import { NotebookUtil } from "../../Notebook/NotebookUtil";
import "./styled.less";

export interface PublishNotebookPaneProps {
  notebookName: string;
  notebookAuthor: string;
  notebookTags: string;
  notebookDescription: string;
  notebookCreatedDate: string;
  notebookObject: ImmutableNotebook;
  notebookContentRef: string;
  imageSrc: string;

  onError: (formError: string, formErrorDetail: string, area: string) => void;
  clearFormError: () => void;
  setNotebookName: (newValue: string) => void;
  setNotebookDescription: (newValue: string) => void;
  setNotebookTags: (newValue: string) => void;
  setImageSrc: (newValue: string) => void;
  onTakeSnapshot: (request: SnapshotRequest) => void;
}

enum ImageTypes {
  Url = "URL",
  CustomImage = "Custom Image",
  TakeScreenshot = "Take Screenshot",
  UseFirstDisplayOutput = "Use First Display Output",
}

export const PublishNotebookPaneComponent: FunctionComponent<PublishNotebookPaneProps> = ({
  notebookName,
  notebookTags,
  notebookDescription,
  notebookAuthor,
  notebookCreatedDate,
  notebookObject,
  notebookContentRef,
  imageSrc,
  onError,
  clearFormError,
  setNotebookName,
  setNotebookDescription,
  setNotebookTags,
  setImageSrc,
  onTakeSnapshot,
}: PublishNotebookPaneProps) => {
  const [type, setType] = useState<string>(ImageTypes.CustomImage);
  const CARD_WIDTH = 256;
  const cardImageHeight = 144;
  const cardHeightToWidthRatio = cardImageHeight / CARD_WIDTH;

  const maxImageSizeInMib = 1.5;

  const descriptionPara1 =
    "When published, this notebook will appear in the Azure Cosmos DB notebooks public gallery. Make sure you have removed any sensitive data or output before publishing.";

  const descriptionPara2 = `Would you like to publish and share "${FileSystemUtil.stripExtension(
    notebookName,
    "ipynb"
  )}" to the gallery?`;

  const options: ImageTypes[] = [ImageTypes.CustomImage, ImageTypes.Url];
  if (onTakeSnapshot) {
    options.push(ImageTypes.TakeScreenshot);
    if (notebookObject) {
      options.push(ImageTypes.UseFirstDisplayOutput);
    }
  }

  const thumbnailSelectorProps: IDropdownProps = {
    label: "Cover image",
    selectedKey: type,
    ariaLabel: "Cover image",
    options: options.map((value: string) => ({ text: value, key: value })),
    onChange: async (event, options) => {
      setImageSrc("");
      clearFormError();
      if (options.text === ImageTypes.TakeScreenshot) {
        onTakeSnapshot({
          aspectRatio: cardHeightToWidthRatio,
          requestId: new Date().getTime().toString(),
          type: "notebook",
          notebookContentRef,
        });
      } else if (options.text === ImageTypes.UseFirstDisplayOutput) {
        const cellIds = NotebookUtil.findCodeCellWithDisplay(notebookObject);
        if (cellIds.length > 0) {
          onTakeSnapshot({
            aspectRatio: cardHeightToWidthRatio,
            requestId: new Date().getTime().toString(),
            type: "celloutput",
            cellId: cellIds[0],
            notebookContentRef,
          });
        } else {
          firstOutputErrorHandler(new Error("Output does not exist for any of the cells."));
        }
      }
      setType(options.text);
    },
  };

  const thumbnailUrlProps: ITextFieldProps = {
    label: "Cover image url",
    ariaLabel: "Cover image url",
    required: true,
    onChange: (event, newValue) => {
      setImageSrc(newValue);
    },
  };

  const firstOutputErrorHandler = (error: Error) => {
    const formError = "Failed to capture first output";
    const formErrorDetail = `${error}`;
    const area = "PublishNotebookPaneComponent/UseFirstOutput";
    onError(formError, formErrorDetail, area);
  };

  const imageToBase64 = (file: File, updateImageSrc: (result: string) => void) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      updateImageSrc(reader.result.toString());
    };

    reader.onerror = (error) => {
      const formError = `Failed to convert ${file.name} to base64 format`;
      const formErrorDetail = `${error}`;
      const area = "PublishNotebookPaneComponent/selectImageFile";
      onError(formError, formErrorDetail, area);
    };
  };

  const renderThumbnailSelectors = (type: string) => {
    switch (type) {
      case ImageTypes.Url:
        return <TextField {...thumbnailUrlProps} />;
      case ImageTypes.CustomImage:
        return (
          <input
            id="selectImageFile"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files[0];
              if (file.size / 1024 ** 2 > maxImageSizeInMib) {
                event.target.value = "";
                const formError = `Failed to upload ${file.name}`;
                const formErrorDetail = `Image is larger than ${maxImageSizeInMib} MiB. Please Choose a different image.`;
                const area = "PublishNotebookPaneComponent/selectImageFile";

                onError(formError, formErrorDetail, area);
                setImageSrc("");
                return;
              } else {
                clearFormError();
              }
              imageToBase64(file, (result: string) => {
                setImageSrc(result);
              });
            }}
          />
        );
      default:
        return <></>;
    }
  };

  return (
    <div className="publishNotebookPanelContent">
      <Stack className="panelMainContent" tokens={{ childrenGap: 20 }}>
        <Stack.Item>
          <Text>{descriptionPara1}</Text>
        </Stack.Item>

        <Stack.Item>
          <Text>{descriptionPara2}</Text>
        </Stack.Item>

        <Stack.Item>
          <TextField
            label="Name"
            ariaLabel="Name"
            defaultValue={FileSystemUtil.stripExtension(notebookName, "ipynb")}
            required
            onChange={(event, newValue) => {
              const notebookName = newValue + ".ipynb";
              setNotebookName(notebookName);
            }}
          />
        </Stack.Item>

        <Stack.Item>
          <TextField
            label="Description"
            ariaLabel="Description"
            multiline
            rows={3}
            required
            onChange={(event, newValue) => {
              setNotebookDescription(newValue);
            }}
          />
        </Stack.Item>

        <Stack.Item>
          <TextField
            label="Tags"
            ariaLabel="Tags"
            placeholder="Optional tag 1, Optional tag 2"
            onChange={(event, newValue) => {
              setNotebookTags(newValue);
            }}
          />
        </Stack.Item>

        <Stack.Item>
          <Dropdown {...thumbnailSelectorProps} />
        </Stack.Item>

        <Stack.Item>{renderThumbnailSelectors(type)}</Stack.Item>

        <Stack.Item>
          <Text>Preview</Text>
        </Stack.Item>
        <Stack.Item>
          <GalleryCardComponent
            data={{
              id: undefined,
              name: notebookName,
              description: notebookDescription,
              gitSha: undefined,
              tags: notebookTags.split(","),
              author: notebookAuthor,
              thumbnailUrl: imageSrc,
              created: notebookCreatedDate,
              isSample: false,
              downloads: undefined,
              favorites: undefined,
              views: undefined,
              newCellId: undefined,
              policyViolations: undefined,
              pendingScanJobIds: undefined,
            }}
            isFavorite={undefined}
            showDownload={false}
            showDelete={false}
            onClick={() => undefined}
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
};
