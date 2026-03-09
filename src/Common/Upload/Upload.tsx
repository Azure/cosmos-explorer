import { Image, Stack, TextField } from "@fluentui/react";
import React, { ChangeEvent, FunctionComponent, KeyboardEvent, useRef, useState } from "react";
import FolderIcon from "../../../images/folder_16x16.svg";
import * as Constants from "../Constants";
import { InfoTooltip } from "../Tooltip/InfoTooltip";

interface UploadProps {
  label: string;
  accept?: string;
  tooltip?: string;
  multiple?: boolean;
  tabIndex?: number;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const Upload: FunctionComponent<UploadProps> = ({
  label,
  accept,
  tooltip,
  multiple,
  tabIndex,
  ...props
}: UploadProps) => {
  const [selectedFilesTitle, setSelectedFilesTitle] = useState<string[]>([]);

  const fileRef = useRef<HTMLInputElement>() as React.MutableRefObject<HTMLInputElement>;

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

    const newFileList = [];
    if (files) {
      for (let i = 0; i < files.length; i++) {
        newFileList.push(files[i].name);
      }
      if (newFileList) {
        setSelectedFilesTitle(newFileList);
        props.onUpload(event);
      }
    }
  };
  const title = label + " to upload";
  return (
    <div>
      <span className="renewUploadItemsHeader" style={{ color: "var(--colorNeutralForeground1)" }}>
        {label}
      </span>
      {tooltip && <InfoTooltip>{tooltip}</InfoTooltip>}
      <Stack horizontal>
        <TextField
          styles={{
            fieldGroup: {
              width: 300,
              backgroundColor: "var(--colorNeutralBackground3)",
              borderColor: "var(--colorNeutralStroke1)",
            },
            field: {
              backgroundColor: "var(--colorNeutralBackground3)",
              color: "var(--colorNeutralForeground1)",
            },
            subComponentStyles: {
              label: {
                root: {
                  color: "var(--colorNeutralForeground1)",
                },
              },
            },
          }}
          readOnly
          value={selectedFilesTitle.toString()}
        />
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
