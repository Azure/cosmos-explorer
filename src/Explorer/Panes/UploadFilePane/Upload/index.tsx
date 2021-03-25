import { IImageProps, Image, ImageFit, Stack, TextField } from "office-ui-fabric-react";
import React, { ChangeEvent, FunctionComponent, KeyboardEvent, useRef, useState } from "react";
import FolderIcon from "../../../../../images/folder_16x16.svg";
import * as Constants from "../../../../Common/Constants";
interface UploadProps {
  label: string;
  extensions: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

const imageProps: Partial<IImageProps> = {
  imageFit: ImageFit.centerCover,
  width: 20,
  height: 20,
  className: "fileIcon",
};

export const Upload: FunctionComponent<UploadProps> = ({ label, extensions, ...props }: UploadProps) => {
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
    if (!files || files.length === 0) {
      return;
    }
    let newFileList = "";
    for (let i = 0; i < files.length; i++) {
      newFileList += `"${files.item(i).name}"`;
    }
    setSelectedFilesTitle(newFileList);
    props.onUpload(event);
  };

  return (
    <div>
      <div className="renewUploadItemsHeader">{label}</div>
      <Stack horizontal>
        <TextField styles={{ fieldGroup: { width: 300 } }} readOnly value={selectedFilesTitle} />
        <input
          type="file"
          id="importFileInput"
          style={{ display: "none" }}
          ref={fileRef}
          accept={extensions}
          onChange={onUpload}
        />
        <a href="#" id="fileImportLinkNotebook" onClick={onImportLinkClick} onKeyPress={onImportLinkKeyPress}>
          <Image className="fileImportImg" src={FolderIcon} alt="upload files" title="Upload files" />
        </a>
      </Stack>
    </div>
  );
};
