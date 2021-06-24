import { extractPartitionKey, PartitionKeyDefinition } from "@azure/cosmos";
import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  IIconProps,
  IImageProps,
  Image,
  ImageFit,
  List,
  PrimaryButton,
  SelectionMode,
  Stack,
  Text,
  TextField,
} from "@fluentui/react";
import {} from "@fluentui/react/lib/Image";
import * as React from "react";
import SplitterLayout from "react-splitter-layout";
import CloseIcon from "../../../images/close-black.svg";
import DeleteDocumentIcon from "../../../images/DeleteDocument.svg";
import DiscardIcon from "../../../images/discard.svg";
import DocumentWaterMark from "../../../images/DocumentWaterMark.svg";
import NewDocumentIcon from "../../../images/NewDocument.svg";
import SaveIcon from "../../../images/save-cosmos.svg";
import { Areas } from "../../Common/Constants";
// import { createDocument } from "../../Common/dataAccess/createDocument";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import { logError } from "../../Common/Logger";
import { createDocument, deleteDocument, queryDocuments, updateDocument } from "../../Common/MongoProxyClient";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import { EditorReact } from "../Controls/Editor/EditorReact";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import DocumentId from "../Tree/DocumentId";
import ObjectId from "../Tree/ObjectId";
import DocumentsTab from "./DocumentsTab";
import { formatDocumentContent, getPartitionKeyDefinition, hasShardKeySpecified } from "./DocumentTabUtils";

const filterIcon: IIconProps = { iconName: "Filter" };

export interface IDocumentsTabContentState {
  columns: IColumn[];
  isModalSelection: boolean;
  isCompactMode: boolean;
  announcedMessage?: string;
  isSuggestionVisible: boolean;
  filter: string;
  isFilterOptionVisible: boolean;
  isEditorVisible: boolean;
  documentContent: string;
  documentIds: Array<DocumentId>;
  editorKey: string;
  selectedDocumentId?: DocumentId;
}

export interface IDocument {
  value: string;
  id: string;
}

interface IButton {
  visible: boolean;
  enabled: boolean;
  isSelected?: boolean;
}

const imageProps: Partial<IImageProps> = {
  imageFit: ImageFit.centerContain,
  width: 40,
  height: 40,
  style: { marginTop: "15px" },
};

const filterSuggestions = [{ value: `{"id": "foo"}` }, { value: "{ qty: { $gte: 20 } }" }];
const intitalDocumentContent = `{ \n "id": "replace_with_new_document_id" \n }`;
export default class DocumentsTabContent extends React.Component<DocumentsTab, IDocumentsTabContentState> {
  public newDocumentButton: IButton;
  public saveNewDocumentButton: IButton;
  public discardNewDocumentChangesButton: IButton;
  public saveExisitingDocumentButton: IButton;
  public discardExisitingDocumentChangesButton: IButton;
  public deleteExisitingDocumentButton: IButton;

  constructor(props: DocumentsTab) {
    super(props);

    this.newDocumentButton = {
      visible: true,
      enabled: true,
    };
    this.saveNewDocumentButton = {
      visible: false,
      enabled: true,
    };
    this.discardNewDocumentChangesButton = {
      visible: false,
      enabled: false,
    };
    this.saveExisitingDocumentButton = {
      visible: false,
      enabled: false,
    };
    this.discardExisitingDocumentChangesButton = {
      visible: false,
      enabled: false,
    };
    this.deleteExisitingDocumentButton = {
      visible: false,
      enabled: false,
    };

    const columns: IColumn[] = [
      {
        key: "_id",
        name: props.idHeader,
        minWidth: 90,
        maxWidth: 140,
        isResizable: true,
        isCollapsible: true,
        data: "string",
        onRender: (item: DocumentId) => {
          return (
            <div onClick={() => this.handleRow(item)} className="documentIdItem">
              {item.rid}
            </div>
          );
        },
        isPadded: true,
      },
      {
        key: "column2",
        name: props.partitionKeyPropertyHeader,
        minWidth: 50,
        maxWidth: 60,
        isResizable: true,
        isCollapsible: true,
        data: "number",
      },
    ];

    this.state = {
      columns: columns,
      isModalSelection: false,
      isCompactMode: false,
      announcedMessage: undefined,
      isSuggestionVisible: false,
      filter: "",
      isFilterOptionVisible: true,
      isEditorVisible: false,
      documentContent: intitalDocumentContent,
      documentIds: [],
      editorKey: "",
    };
  }

  async componentDidMount(): void {
    this.updateTabButton();
    if (userContext.apiType === "Mongo") {
      this.queryDocumentsData();
    }
  }

  queryDocumentsData = async (): Promise<void> => {
    this.props.isExecuting(true);
    this.props.isExecutionError(false);
    try {
      const { filter } = this.state;
      const query: string = filter || "{}";
      const queryDocumentsData = await queryDocuments(
        this.props.collection.databaseId,
        this.props.collection,
        true,
        query,
        undefined
      );
      if (queryDocumentsData) {
        const nextDocumentIds = queryDocumentsData.documents.map((rawDocument: any) => {
          const partitionKeyValue = rawDocument._partitionKeyValue;
          return new DocumentId(this.props, rawDocument, partitionKeyValue);
        });

        this.setState({ documentIds: nextDocumentIds });
      }
      if (this.props.onLoadStartKey !== undefined) {
        TelemetryProcessor.traceSuccess(
          Action.Tab,
          {
            databaseName: this.props.collection.databaseId,
            collectionName: this.props.collection.id(),

            dataExplorerArea: Areas.Tab,
            tabTitle: this.props.tabTitle(),
          },
          this.props.onLoadStartKey
        );
      }
      this.props.isExecuting(false);
    } catch (error) {
      if (this.props.onLoadStartKey !== undefined) {
        TelemetryProcessor.traceFailure(
          Action.Tab,
          {
            databaseName: this.props.collection.databaseId,
            collectionName: this.props.collection.id(),

            dataExplorerArea: Areas.Tab,
            tabTitle: this.props.tabTitle(),
            error: getErrorMessage(error),
            errorStack: getErrorStack(error),
          },
          this.props.onLoadStartKey
        );
      }
      this.props.isExecuting(false);
    }
  };

  handleRow = (row: DocumentId): void => {
    const formattedDocumentContent = formatDocumentContent(row);
    this.newDocumentButton = {
      visible: false,
      enabled: false,
    };
    this.saveNewDocumentButton = {
      visible: false,
      enabled: false,
    };
    this.discardNewDocumentChangesButton = {
      visible: false,
      enabled: false,
    };
    this.saveExisitingDocumentButton = {
      visible: true,
      enabled: false,
    };
    this.discardExisitingDocumentChangesButton = {
      visible: true,
      enabled: false,
    };
    this.deleteExisitingDocumentButton = {
      visible: true,
      enabled: true,
    };
    this.setState(
      {
        documentContent: formattedDocumentContent,
        isEditorVisible: true,
        editorKey: row.rid,
        selectedDocumentId: row,
      },
      () => {
        this.updateTabButton();
      }
    );
  };

  formatDocumentContent = (row: DocumentId): string => {
    const { partitionKeyProperty, partitionKeyValue, rid, self, stringPartitionKeyValue, ts } = row;
    const documentContent = JSON.stringify({
      partitionKeyProperty: partitionKeyProperty || "",
      partitionKeyValue: partitionKeyValue || "",
      rid: rid || "",
      self: self || "",
      stringPartitionKeyValue: stringPartitionKeyValue || "",
      ts: ts || "",
    });
    const formattedDocumentContent = documentContent.replace(/,/g, ",\n").replace("{", "{\n").replace("}", "\n}");
    return formattedDocumentContent;
  };

  handleFilter = (): void => {
    this.queryDocumentsData();
    this.setState({
      isSuggestionVisible: false,
    });
  };

  private async updateMongoDocument(): Promise<void> {
    const { selectedDocumentId, documentContent, documentIds } = this.state;
    const { isExecutionError, isExecuting, tabTitle, collection, partitionKey, partitionKeyProperty } = this.props;
    isExecutionError(false);
    isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateDocument, {
      dataExplorerArea: Areas.Tab,
      tabTitle: tabTitle(),
    });

    try {
      const updatedDocument = await updateDocument(
        collection.databaseId,
        collection,
        selectedDocumentId,
        documentContent
      );
      documentIds.forEach((documentId: DocumentId) => {
        if (documentId.rid === updatedDocument._rid) {
          const partitionKeyArray = extractPartitionKey(
            updatedDocument,
            getPartitionKeyDefinition(partitionKey, partitionKeyProperty) as PartitionKeyDefinition
          );

          const partitionKeyValue = partitionKeyArray && partitionKeyArray[0];

          const id = new ObjectId(this.props, updatedDocument, partitionKeyValue);
          documentId.id(id.id());
        }
      });
      TelemetryProcessor.traceSuccess(
        Action.UpdateDocument,
        {
          dataExplorerArea: Areas.Tab,
          tabTitle: tabTitle(),
        },
        startKey
      );
      isExecuting(false);
    } catch (error) {
      isExecutionError(true);
      const errorMessage = getErrorMessage(error);
      window.alert(errorMessage);
      TelemetryProcessor.traceFailure(
        Action.UpdateDocument,
        {
          dataExplorerArea: Areas.Tab,
          tabTitle: tabTitle(),
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
      isExecuting(false);
    }
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    const label = "New Document";
    if (this.newDocumentButton.visible) {
      buttons.push({
        iconSrc: NewDocumentIcon,
        iconAlt: label,
        onCommandClick: this.onNewDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.newDocumentButton.enabled,
      });
    }

    if (this.saveNewDocumentButton.visible) {
      const label = "Save";
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: this.onSaveNewDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.saveNewDocumentButton.enabled,
      });
    }

    if (this.discardNewDocumentChangesButton.visible) {
      const label = "Discard";
      buttons.push({
        iconSrc: DiscardIcon,
        iconAlt: label,
        onCommandClick: this.onRevertNewDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.discardNewDocumentChangesButton.enabled,
      });
    }

    if (this.saveExisitingDocumentButton.visible) {
      const label = "Update";
      buttons.push({
        ...this,
        updateMongoDocument: this.updateMongoDocument,
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: this.onSaveExisitingDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.saveExisitingDocumentButton.enabled,
      });
    }

    if (this.discardExisitingDocumentChangesButton.visible) {
      const label = "Discard";
      buttons.push({
        ...this,
        setState: this.setState,
        iconSrc: DiscardIcon,
        iconAlt: label,
        onCommandClick: this.onRevertExisitingDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.discardExisitingDocumentChangesButton.enabled,
      });
    }

    if (this.deleteExisitingDocumentButton.visible) {
      const label = "Delete";
      buttons.push({
        ...this,
        iconSrc: DeleteDocumentIcon,
        iconAlt: label,
        onCommandClick: this.onDeleteExisitingDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.deleteExisitingDocumentButton.enabled,
      });
    }

    return buttons;
  }

  private onSaveExisitingDocumentClick(): void {
    this.updateMongoDocument();
  }

  private onDeleteExisitingDocumentClick(): Promise<void> {
    const { collection } = this.props;
    return deleteDocument(collection.databaseId, collection, this.state.selectedDocumentId);
  }

  private onRevertExisitingDocumentClick(): void {
    this.setState({
      documentContent: formatDocumentContent(this.state.selectedDocumentId),
      editorKey: Math.random().toString(),
    });
  }

  private onNewDocumentClick = () => {
    this.newDocumentButton = {
      visible: true,
      enabled: false,
    };
    this.saveNewDocumentButton = {
      visible: true,
      enabled: true,
    };

    this.discardNewDocumentChangesButton = {
      visible: true,
      enabled: true,
    };
    this.updateTabButton();
    this.setState({
      documentContent: intitalDocumentContent,
      isEditorVisible: true,
      editorKey: intitalDocumentContent,
    });
  };

  private onSaveNewDocumentClick = () => {
    if (userContext.apiType === "Mongo") {
      this.onSaveNewMongoDocumentClick();
    }
  };

  public onSaveNewMongoDocumentClick = async (): Promise<void> => {
    const parsedDocumentContent = JSON.parse(this.state.documentContent);
    const {
      partitionKey,
      partitionKeyProperty,
      displayedError,
      tabTitle,
      isExecutionError,
      isExecuting,
      collection,
    } = this.props;
    displayedError("");

    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDocument, {
      dataExplorerArea: Areas.Tab,
      tabTitle: tabTitle(),
    });

    if (
      partitionKeyProperty &&
      partitionKeyProperty !== "_id" &&
      !hasShardKeySpecified(parsedDocumentContent, partitionKey, partitionKeyProperty)
    ) {
      const message = `The document is lacking the shard property: ${partitionKeyProperty}`;
      displayedError(message);
      TelemetryProcessor.traceFailure(
        Action.CreateDocument,
        {
          dataExplorerArea: Areas.Tab,
          tabTitle: tabTitle(),
          error: message,
        },
        startKey
      );
      logError("Failed to save new document: Document shard key not defined", "MongoDocumentsTab");
      throw new Error("Document without shard key");
    }

    isExecutionError(false);
    isExecuting(true);
    try {
      const savedDocument = await createDocument(
        collection.databaseId,
        collection,
        partitionKeyProperty,
        parsedDocumentContent
      );
      if (savedDocument) {
        this.handleLoadMoreDocument();
        TelemetryProcessor.traceSuccess(
          Action.CreateDocument,
          {
            dataExplorerArea: Areas.Tab,
            tabTitle: tabTitle(),
          },
          startKey
        );
      }
      this.queryDocumentsData();
      isExecuting(false);
    } catch (error) {
      isExecutionError(true);
      const errorMessage = getErrorMessage(error);
      window.alert(errorMessage);
      TelemetryProcessor.traceFailure(
        Action.CreateDocument,
        {
          dataExplorerArea: Areas.Tab,
          tabTitle: tabTitle(),
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
      isExecuting(false);
    }
  };

  private onRevertNewDocumentClick = () => {
    this.newDocumentButton = {
      visible: true,
      enabled: true,
    };
    this.saveNewDocumentButton = {
      visible: true,
      enabled: false,
    };

    this.discardNewDocumentChangesButton = {
      visible: true,
      enabled: false,
    };

    this.updateTabButton();
    this.setState({ isEditorVisible: false });
  };

  onRenderCell = (item: { value: string }): JSX.Element => {
    return (
      <div
        className="documentTabSuggestions"
        onClick={() =>
          this.setState({
            filter: item.value,
            isSuggestionVisible: false,
          })
        }
      >
        <Text>{item.value}</Text>
      </div>
    );
  };

  handleLoadMoreDocument = (): void => {
    this.queryDocumentsData();
    this.setState({ isSuggestionVisible: false });
  };

  private updateTabButton = (): void => {
    useCommandBar.getState().setContextButtons(this.getTabsButtons());
  };

  private handleDocumentContentChange = (newContent: string): void => {
    if (this.saveExisitingDocumentButton.visible) {
      this.saveExisitingDocumentButton = {
        visible: true,
        enabled: true,
      };
      this.discardExisitingDocumentChangesButton = {
        visible: true,
        enabled: true,
      };

      this.updateTabButton();
    }

    this.setState({ documentContent: newContent });
  };

  public render(): JSX.Element {
    const {
      columns,
      isCompactMode,
      isSuggestionVisible,
      filter,
      isFilterOptionVisible,
      isEditorVisible,
      documentContent,
      documentIds,
      editorKey,
    } = this.state;

    return (
      <div>
        {isFilterOptionVisible && (
          <div>
            <div>
              <Stack horizontal verticalFill wrap>
                <TextField
                  iconProps={filterIcon}
                  placeholder="Type a query predicate (e.g., {´a´:´foo´}), or choose one from the drop down list, or leave empty to query all documents."
                  className="documentTabSearchBar"
                  onFocus={() => this.setState({ isSuggestionVisible: true })}
                  onChange={(_event, newInput?: string) => {
                    this.setState({ filter: newInput });
                  }}
                  value={filter}
                />
                <PrimaryButton text="Apply Filter" onClick={this.handleFilter} className="documentTabFiltetButton" />
                <Image
                  src={CloseIcon}
                  alt="Close icon"
                  {...imageProps}
                  onClick={() => this.setState({ isFilterOptionVisible: false })}
                />
              </Stack>
            </div>
            {isSuggestionVisible && (
              <div className="filterSuggestions">
                <List items={filterSuggestions} onRenderCell={this.onRenderCell} />
              </div>
            )}
          </div>
        )}
        {!isFilterOptionVisible && (
          <Stack horizontal verticalFill wrap className="documentTabNoFilterView">
            <Text className="noFilterText">No filter applied</Text>
            <PrimaryButton text="Edit Filter" onClick={() => this.setState({ isFilterOptionVisible: true })} />
          </Stack>
        )}
        <div className="splitterWrapper" onClick={() => this.setState({ isSuggestionVisible: false })}>
          <SplitterLayout primaryIndex={0} secondaryInitialSize={1000}>
            <div className="leftSplitter">
              <DetailsList
                items={documentIds}
                compact={isCompactMode}
                columns={columns}
                selectionMode={SelectionMode.none}
                getKey={this.getKey}
                setKey="none"
                layoutMode={DetailsListLayoutMode.justified}
                isHeaderVisible={true}
              />
              <Text onClick={this.handleLoadMoreDocument} className="documentLoadMore" block={true}>
                Load More
              </Text>
            </div>
            {isEditorVisible ? (
              <div className="react-editor">
                <EditorReact
                  language={"json"}
                  content={documentContent}
                  isReadOnly={false}
                  ariaLabel={"Document json"}
                  onContentChanged={this.handleDocumentContentChange}
                  lineNumbers="on"
                  editorKey={editorKey}
                />
              </div>
            ) : (
              <div className="documentTabWatermark">
                <Image src={DocumentWaterMark} alt="Document watermark" />
                <Text className="documentCreateText">Create new or work with existing document(s).</Text>
              </div>
            )}
          </SplitterLayout>
        </div>
      </div>
    );
  }

  private getKey(item: DocumentId): string {
    return item.rid;
  }
}
