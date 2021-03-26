import { IImageProps, Image, ImageFit, Stack, TextField } from "office-ui-fabric-react";
import React, { ChangeEvent, FunctionComponent, KeyboardEvent, useRef, useState } from "react";
import FolderIcon from "../../../images/folder_16x16.svg";
import * as Constants from "../../Common/Constants";
import { Tooltip } from "../Tooltip";

interface UploadProps {
  label: string;
  accept?: string;
  tooltip: string;
  multiple: boolean;
  tabIndex: number;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

const imageProps: Partial<IImageProps> = {
  imageFit: ImageFit.centerCover,
  width: 20,
  height: 20,
  className: "fileIcon",
};

export const Upload: FunctionComponent<UploadProps> = ({
  label,
  accept,
  tooltip,
  multiple,
  tabIndex,
  ...props
}: UploadProps) => {
  const [selectedFilesTitle, setSelectedFilesTitle] = useState<string>("");

  const fileRef = useRef<HTMLInputElement>();

  const onImportLinkKeyPress = (event: KeyboardEvent<HTMLAnchorElement>): void => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      onImportLinkClick();
    }
  };

  const onImportLinkClick = (): void => {
    fileRef?.current?.click();
  };

  const onUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const { files } = event.target;

    let newFileList = "";
    for (let i = 0; i < files.length; i++) {
      newFileList += `"${files.item(i).name}"`;
    }
    if (newFileList) {
      setSelectedFilesTitle(newFileList);
      props.onUpload(event);
    }
  };
  const title = label + " to upload";
  return (
    <div>
      <span className="renewUploadItemsHeader">{label}</span>
      <Tooltip>{tooltip}</Tooltip>
      <Stack horizontal>
        <TextField styles={{ fieldGroup: { width: 300 } }} readOnly value={selectedFilesTitle} />
        <input
          type="file"
          id="importFileInput"
          style={{ display: "none" }}
          ref={fileRef}
          accept={accept}
          tabIndex={tabIndex}
          multiple={multiple}
          title="Upload Icon"
          onChange={onUpload}
          role="button"
        />
        <a href="#" id="fileImportLinkNotebook" onClick={onImportLinkClick} onKeyPress={onImportLinkKeyPress}>
          <Image className="fileImportImg" src={FolderIcon} alt={title} title={title} />
        </a>
      </Stack>
    </div>
  );
};
