import * as React from "react";
import DeleteIcon from "../../../../images/delete.svg";
import { Button } from "office-ui-fabric-react/lib/Button";
import { DetailsList, IColumn, SelectionMode } from "office-ui-fabric-react/lib/DetailsList";
import { Library } from "../../../Contracts/DataModels";
import { Label } from "office-ui-fabric-react/lib/Label";
import { SparkLibrary } from "../../../Common/Constants";
import { TextField } from "office-ui-fabric-react/lib/TextField";

export interface LibraryManageComponentProps {
  addProps: {
    nameProps: LibraryAddNameTextFieldProps;
    urlProps: LibraryAddUrlTextFieldProps;
    buttonProps: LibraryAddButtonProps;
  };
  gridProps: LibraryManageGridProps;
}

export function LibraryManageComponent(props: LibraryManageComponentProps): JSX.Element {
  const {
    addProps: { nameProps, urlProps, buttonProps },
    gridProps
  } = props;
  return (
    <div>
      <div className="library-add-container">
        <LibraryAddNameTextField {...nameProps} />
        <LibraryAddUrlTextField {...urlProps} />
        <LibraryAddButton {...buttonProps} />
      </div>
      <div className="library-grid-container">
        <Label>All Libraries</Label>
        <LibraryManageGrid {...gridProps} />
      </div>
    </div>
  );
}

export interface LibraryManageGridProps {
  items: Library[];
  onLibraryDeleteClick: (libraryName: string) => void;
}

function LibraryManageGrid(props: LibraryManageGridProps): JSX.Element {
  const columns: IColumn[] = [
    {
      key: "name",
      name: "Name",
      fieldName: "name",
      minWidth: 200
    },
    {
      key: "delete",
      name: "Delete",
      minWidth: 60,
      onRender: (item: Library) => {
        const onDelete = () => {
          props.onLibraryDeleteClick(item.name);
        };
        return (
          <span className="library-delete">
            <img src={DeleteIcon} alt="Delete" onClick={onDelete} />
          </span>
        );
      }
    }
  ];
  return <DetailsList columns={columns} items={props.items} selectionMode={SelectionMode.none} />;
}

export interface LibraryAddButtonProps {
  disabled: boolean;
  onLibraryAddClick: (event: React.FormEvent<any>) => void;
}

function LibraryAddButton(props: LibraryAddButtonProps): JSX.Element {
  return (
    <Button text="Add" className="library-add-button" onClick={props.onLibraryAddClick} disabled={props.disabled} />
  );
}

export interface LibraryAddUrlTextFieldProps {
  libraryAddress: string;
  onLibraryAddressChange: (libraryAddress: string) => void;
  onLibraryAddressValidated: (errorMessage: string, value: string) => void;
}

function LibraryAddUrlTextField(props: LibraryAddUrlTextFieldProps): JSX.Element {
  const handleTextChange = (e: React.FormEvent<any>, libraryAddress: string) => {
    props.onLibraryAddressChange(libraryAddress);
  };
  const validateText = (text: string): string => {
    if (!text) {
      return "";
    }
    const libraryUrlRegex = /^(https:\/\/.+\/)(.+)\.(jar)$/gi;
    const isValidUrl = libraryUrlRegex.test(text);
    if (isValidUrl) {
      return "";
    }
    return "Need to be a valid https uri";
  };
  return (
    <TextField
      value={props.libraryAddress}
      label="Url"
      type="url"
      className="library-add-textfield"
      onChange={handleTextChange}
      onGetErrorMessage={validateText}
      onNotifyValidationResult={props.onLibraryAddressValidated}
      placeholder="https://myrepo/myjar.jar"
      autoComplete="off"
    />
  );
}

export interface LibraryAddNameTextFieldProps {
  libraryName: string;
  onLibraryNameChange: (libraryName: string) => void;
  onLibraryNameValidated: (errorMessage: string, value: string) => void;
}

function LibraryAddNameTextField(props: LibraryAddNameTextFieldProps): JSX.Element {
  const handleTextChange = (e: React.FormEvent<any>, libraryName: string) => {
    props.onLibraryNameChange(libraryName);
  };
  const validateText = (text: string): string => {
    if (!text) {
      return "";
    }
    const length = text.length;
    if (length < SparkLibrary.nameMinLength || length > SparkLibrary.nameMaxLength) {
      return "Library name length need to be between 3 and 63.";
    }
    const nameRegex = /^[a-z0-9][-a-z0-9]*[a-z0-9]$/gi;
    const isValidUrl = nameRegex.test(text);
    if (isValidUrl) {
      return "";
    }
    return "Need to be a valid name. Letters, numbers and - are allowed";
  };
  return (
    <TextField
      value={props.libraryName}
      label="Name"
      type="text"
      className="library-add-textfield"
      onChange={handleTextChange}
      onGetErrorMessage={validateText}
      onNotifyValidationResult={props.onLibraryNameValidated}
      placeholder="myjar"
      autoComplete="off"
    />
  );
}
