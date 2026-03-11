import { Dropdown, IDropdownProps, ITextFieldProps, Stack, Text, TextField } from "@fluentui/react";
import { ImmutableNotebook } from "@nteract/commutable";
import React, { FunctionComponent, useState } from "react";
import { Keys, t } from "Localization";
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

  const descriptionPara1 = t(Keys.panes.publishNotebook.publishDescription);

  const descriptionPara2 = t(Keys.panes.publishNotebook.publishPrompt, {
    name: FileSystemUtil.stripExtension(notebookName, "ipynb"),
  });

  const options: ImageTypes[] = [ImageTypes.CustomImage, ImageTypes.Url];
  if (onTakeSnapshot) {
    options.push(ImageTypes.TakeScreenshot);
    if (notebookObject) {
      options.push(ImageTypes.UseFirstDisplayOutput);
    }
  }

  const thumbnailSelectorProps: IDropdownProps = {
    label: t(Keys.panes.publishNotebook.coverImage),
    selectedKey: type,
    ariaLabel: t(Keys.panes.publishNotebook.coverImage),
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
          firstOutputErrorHandler(new Error(t(Keys.panes.publishNotebook.outputDoesNotExist)));
        }
      }
      setType(options.text);
    },
  };

  const thumbnailUrlProps: ITextFieldProps = {
    label: t(Keys.panes.publishNotebook.coverImageUrl),
    ariaLabel: t(Keys.panes.publishNotebook.coverImageUrl),
    required: true,
    onChange: (event, newValue) => {
      setImageSrc(newValue);
    },
  };

  const firstOutputErrorHandler = (error: Error) => {
    const formError = t(Keys.panes.publishNotebook.failedToCaptureOutput);
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
      const formError = t(Keys.panes.publishNotebook.failedToConvertError, { fileName: file.name });
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
                const formError = t(Keys.panes.publishNotebook.failedToUploadError, { fileName: file.name });
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
            label={t(Keys.panes.publishNotebook.name)}
            ariaLabel={t(Keys.panes.publishNotebook.name)}
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
            label={t(Keys.panes.publishNotebook.description)}
            ariaLabel={t(Keys.panes.publishNotebook.description)}
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
            label={t(Keys.panes.publishNotebook.tags)}
            ariaLabel={t(Keys.panes.publishNotebook.tags)}
            placeholder={t(Keys.panes.publishNotebook.tagsPlaceholder)}
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
          <Text>{t(Keys.panes.publishNotebook.preview)}</Text>
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
