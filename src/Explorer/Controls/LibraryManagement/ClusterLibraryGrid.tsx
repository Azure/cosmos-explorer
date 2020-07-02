import * as React from "react";
import { DetailsList, IColumn, SelectionMode } from "office-ui-fabric-react/lib/DetailsList";
import { Library } from "../../../Contracts/DataModels";

export interface ClusterLibraryItem extends Library {
  installed: boolean;
}

export interface ClusterLibraryGridProps {
  libraryItems: ClusterLibraryItem[];
  onInstalledChanged: (libraryName: string, installed: boolean) => void;
}

export function ClusterLibraryGrid(props: ClusterLibraryGridProps): JSX.Element {
  const onInstalledChanged = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target;
    const libraryName = (target as any).dataset.name;
    const checked = (target as any).checked;
    return props.onInstalledChanged(libraryName, checked);
  };

  const columns: IColumn[] = [
    {
      key: "name",
      name: "Name",
      fieldName: "name",
      minWidth: 150,
    },
    {
      key: "installed",
      name: "Installed",
      minWidth: 100,
      onRender: (item: ClusterLibraryItem) => {
        return <input type="checkbox" checked={item.installed} onChange={onInstalledChanged} data-name={item.name} />;
      },
    },
  ];

  return <DetailsList columns={columns} items={props.libraryItems} selectionMode={SelectionMode.none} />;
}
