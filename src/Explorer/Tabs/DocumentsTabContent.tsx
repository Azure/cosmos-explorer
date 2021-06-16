import { DetailsList, DetailsListLayoutMode, IColumn, Selection, SelectionMode } from '@fluentui/react/lib/DetailsList';
import * as React from 'react';
import SplitterLayout from 'react-splitter-layout';
import { EditorReact } from "../Controls/Editor/EditorReact";


export interface IDetailsListDocumentsExampleState {
  columns: IColumn[];
  items: any;
  selectionDetails: string;
  isModalSelection: boolean;
  isCompactMode: boolean;
  announcedMessage?: string;
}

export interface IDocument {
  key: string;
  name: string;
  value: string;
  iconName: string;
  fileType: string;
  modifiedBy: string;
  dateModified: string;
  dateModifiedValue: number;
  fileSize: string;
  fileSizeRaw: number;
}

export default class DocumentsTabContent extends React.Component<{}, IDetailsListDocumentsExampleState> {
  private _selection: Selection;

  constructor(props: {}) {
    super(props);

    const columns: IColumn[] = [
      {
        key: 'column4',
        name: 'Modified By',
        fieldName: 'modifiedBy',
        minWidth: 70,
        maxWidth: 90,
        isResizable: true,
        isCollapsible: true,
        data: 'string',
        onColumnClick: this._onColumnClick,
        onRender: (item: IDocument) => {
          return <span>{item.modifiedBy}</span>;
        },
        isPadded: true,
      },
      {
        key: 'column5',
        name: 'File Size',
        fieldName: 'fileSizeRaw',
        minWidth: 70,
        maxWidth: 90,
        isResizable: true,
        isCollapsible: true,
        data: 'number',
        onColumnClick: this._onColumnClick,
        onRender: (item: IDocument) => {
          return <span>{item.fileSize}</span>;
        },
      },
    ];

    this._selection = new Selection({
      onSelectionChanged: () => {
        this.setState({
          selectionDetails: this._getSelectionDetails(),
        });
      },
    });

    const items = [
      {
        fileSize: "44 KB",
        modifiedBy: "Dolor Sit",
      },
      {
        fileSize: "44 KB",
        modifiedBy: "Dolor Sit",
      }
    ]

    this.state = {
      items: items,
      columns: columns,
      selectionDetails: this._getSelectionDetails(),
      isModalSelection: false,
      isCompactMode: false,
      announcedMessage: undefined,
    };
  }

  public render(): JSX.Element {
    const { columns, isCompactMode, items } = this.state;

    return (
      <div>
        <SplitterLayout primaryIndex={0} secondaryInitialSize={1000}>
          <DetailsList
            items={items}
            compact={isCompactMode}
            columns={columns}
            selectionMode={SelectionMode.none}
            getKey={this._getKey}
            setKey="none"
            layoutMode={DetailsListLayoutMode.justified}
            isHeaderVisible={true}
            onItemInvoked={this._onItemInvoked}
          />
          <div className="react-editor">
            <EditorReact
              language={"json"}
              content={`{
                name: "bosy"
              }`}
              isReadOnly={false}
              ariaLabel={"Graph JSON"}
            // onContentChanged={this.handleTriggerBodyChange}
            />
          </div>
        </SplitterLayout>
      </div>

    );
  }

  private _getKey(item: any, index?: number): string {
    return item.key;
  }


  private _onItemInvoked(item: any): void {
    alert(`Item invoked: ${item.name}`);
  }

  private _getSelectionDetails(): string {
    const selectionCount = this._selection.getSelectedCount();

    switch (selectionCount) {
      case 0:
        return 'No items selected';
      case 1:
        return '1 item selected: ' + (this._selection.getSelection()[0] as IDocument).name;
      default:
        return `${selectionCount} items selected`;
    }
  }

  private _onColumnClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn): void => {
    console.log("====>", column)
  }
}
