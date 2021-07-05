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
  TextField
} from "@fluentui/react";
import * as React from "react";
import SplitterLayout from "react-splitter-layout";
import CloseIcon from "../../../images/close-black.svg";
import DeleteDocumentIcon from "../../../images/DeleteDocument.svg";
import DiscardIcon from "../../../images/discard.svg";
import DocumentWaterMark from "../../../images/DocumentWaterMark.svg";
import NewDocumentIcon from "../../../images/NewDocument.svg";
import SaveIcon from "../../../images/save-cosmos.svg";
import UploadIcon from "../../../images/Upload_16x16.svg";
import { Resource } from "../../../src/Contracts/DataModels";
import { Areas } from "../../Common/Constants";
import { createDocument as createSqlDocuments } from "../../Common/dataAccess/createDocument";
import { deleteDocument as deleteSqlDocument } from "../../Common/dataAccess/deleteDocument";
import { queryDocuments as querySqlDocuments } from "../../Common/dataAccess/queryDocuments";
import { updateDocument as updateSqlDocuments } from "../../Common/dataAccess/updateDocument";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import * as HeadersUtility from "../../Common/HeadersUtility";
import { logError } from "../../Common/Logger";
import { createDocument, deleteDocument, queryDocuments, updateDocument } from "../../Common/MongoProxyClient";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import * as QueryUtils from "../../Utils/QueryUtils";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import { EditorReact } from "../Controls/Editor/EditorReact";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import DocumentId from "../Tree/DocumentId";
import ObjectId from "../Tree/ObjectId";
import DocumentsTab from "./DocumentsTab1";
import {
  formatDocumentContent,
  formatSqlDocumentContent,
  getDocumentItems,
  getFilterPlaceholder,
  getFilterSuggestions,
  getPartitionKeyDefinition,
  hasShardKeySpecified
} from "./DocumentTabUtils";

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
  documentSqlIds: Array<Resource>;
  editorKey: string;
  selectedDocumentId?: DocumentId;
  selectedSqlDocumentId?: Resource;
  isEditorContentEdited: boolean;
  isAllDocumentsVisible: boolean;
}

export interface IDocumentsTabContentProps extends DocumentsTab {
  _resourceTokenPartitionKey: string;
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
        name: userContext.apiType === "Mongo" ? "_id" : "id",
        minWidth: 90,
        maxWidth: 140,
        isResizable: true,
        isCollapsible: true,
        data: "string",
        onRender: (item: DocumentId) => {
          return (
            <div onClick={() => this.handleRow(item)} className="documentIdItem">
              {userContext.apiType === "Mongo" ? item.rid : item.id}
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
      documentSqlIds: [],
      editorKey: "",
      isEditorContentEdited: false,
      isAllDocumentsVisible: false,
    };
  }

  componentDidMount(): void {
    this.props.isExecuting(true);
    this.updateTabButton();
    if (userContext.apiType === "Mongo") {
      this.queryDocumentsData();
    } else {
      this.querySqlDocumentsData();
    }
  }

  public buildQuery(filter: string): string {
    return QueryUtils.buildDocumentsQuery(filter, this.props.partitionKeyProperty, this.props.partitionKey);
  }

  querySqlDocumentsData = async (): Promise<void> => {
    this.props.isExecuting(true);
    this.props.isExecutionError(false);
    const { filter } = this.state;
    const query: string = this.buildQuery(filter);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {};
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();
    if (this.props._resourceTokenPartitionKey) {
      options.partitionKey = this.props._resourceTokenPartitionKey;
    }

    try {
      const sqlQuery = querySqlDocuments(this.props.collection.databaseId, this.props.collection.id(), query, options);
      const querySqlDocumentsData = await sqlQuery.fetchNext();
      this.setState({ documentSqlIds: querySqlDocumentsData.resources.length ? querySqlDocumentsData.resources : [] });
      this.props.isExecuting(false);
    } catch (error) {
      this.props.isExecuting(false);
      this.props.isExecutionError(true);
      const errorMessage = getErrorMessage(error);
      window.alert(errorMessage);
    }
  };

  queryDocumentsData = async (): Promise<void> => {
    this.props.isExecuting(true);
    this.props.isExecutionError(false);
    try {
      const { filter } = this.state;
      const query: string = filter || "{}";
      const queryDocumentsData = await queryDocuments(
        this.props.collection.databaseId,
        this.props.collection as ViewModels.Collection,
        true,
        query,
        undefined
      );
      if (queryDocumentsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nextDocumentIds = queryDocumentsData.documents.map((rawDocument: any) => {
          const partitionKeyValue = rawDocument.partitionKeyValue;
          return new DocumentId(this.props as DocumentsTab, rawDocument, partitionKeyValue);
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

  handleRow = (row: DocumentId | Resource): void => {
    if (this.state.isEditorContentEdited) {
      const isChangesConfirmed = window.confirm("Your unsaved changes will be lost.");
      if (isChangesConfirmed) {
        this.handleRowContent(row);
        this.setState({ isEditorContentEdited: false });
        return;
      }
    } else {
      this.handleRowContent(row);
    }
  };

  handleRowContent = (row: DocumentId | Resource): void => {
    const formattedDocumentContent =
      userContext.apiType === "Mongo"
        ? formatDocumentContent(row as DocumentId)
        : formatSqlDocumentContent(row as Resource);
    this.newDocumentButton = {
      visible: true,
      enabled: true,
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
    userContext.apiType === "Mongo"
      ? this.updateContent(row as DocumentId, formattedDocumentContent)
      : this.updateSqlContent(row as Resource, formattedDocumentContent);
  };

  updateContent = (row: DocumentId, formattedDocumentContent: string): void => {
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

  updateSqlContent = (row: Resource, formattedDocumentContent: string): void => {
    this.setState(
      {
        documentContent: formattedDocumentContent,
        isEditorVisible: true,
        editorKey: row._rid,
        selectedSqlDocumentId: row,
      },
      () => {
        this.updateTabButton();
      }
    );
  };

  handleFilter = (): void => {
    userContext.apiType === "Mongo" ? this.queryDocumentsData() : this.querySqlDocumentsData();
    this.setState({
      isSuggestionVisible: false,
    });
  };

  async updateSqlDocument(): Promise<void> {
    const { partitionKey, partitionKeyProperty, isExecutionError, isExecuting, tabTitle, collection } = this.props;
    const { documentContent } = this.state;
    const partitionKeyArray = extractPartitionKey(
      this.state.selectedSqlDocumentId,
      getPartitionKeyDefinition(partitionKey, partitionKeyProperty) as PartitionKeyDefinition
    );

    const partitionKeyValue = partitionKeyArray && partitionKeyArray[0];
    const selectedDocumentId = new DocumentId(
      this.props as DocumentsTab,
      this.state.selectedSqlDocumentId,
      partitionKeyValue
    );
    isExecutionError(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateDocument, {
      dataExplorerArea: Areas.Tab,
      tabTitle: tabTitle(),
    });

    try {
      isExecuting(true);
      const updateSqlDocumentRes = await updateSqlDocuments(
        collection as ViewModels.Collection,
        selectedDocumentId,
        documentContent
      );
      if (updateSqlDocumentRes) {
        TelemetryProcessor.traceSuccess(
          Action.UpdateDocument,
          {
            dataExplorerArea: Areas.Tab,
            tabTitle: tabTitle(),
          },
          startKey
        );
        this.querySqlDocumentsData();
        isExecuting(false);
      }
    } catch (error) {
      isExecutionError(true);
      isExecuting(false);
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
    }
  }

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
        collection as ViewModels.Collection,
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
          const id = new ObjectId(this.props as DocumentsTab, updatedDocument, partitionKeyValue);
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
      this.setState({ isEditorContentEdited: false });
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
    const label = userContext.apiType === "Mongo" ? "New Document" : "New Item";
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
        updateSqlDocument: this.updateSqlDocument,
        setState: this.setState,
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
        setState: this.setState,
        iconSrc: DeleteDocumentIcon,
        iconAlt: label,
        onCommandClick: this.onDeleteExisitingDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.deleteExisitingDocumentButton.enabled,
      });
    }
    if (userContext.apiType !== "Mongo") {
      const { collection } = this.props;
      const label = "Upload Item";
      buttons.push({
        iconSrc: UploadIcon,
        iconAlt: label,
        onCommandClick: () => {
          const selectedCollection: ViewModels.Collection = collection.container.findSelectedCollection();
          selectedCollection && collection.container.openUploadItemsPanePane();
        },
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: collection.container.isDatabaseNodeOrNoneSelected(),
      });
    }
    return buttons;
  }

  private onSaveExisitingDocumentClick(): void {
    userContext.apiType === "Mongo" ? this.updateMongoDocument() : this.updateSqlDocument();
  }

  private async onDeleteExisitingDocumentClick(): Promise<void> {
    const msg =
      userContext.apiType !== "Mongo"
        ? "Are you sure you want to delete the selected item ?"
        : "Are you sure you want to delete the selected document ?";

    const { isExecutionError, isExecuting, collection, tabTitle, partitionKey, partitionKeyProperty } = this.props;
    const partitionKeyArray = extractPartitionKey(
      this.state.selectedSqlDocumentId,
      getPartitionKeyDefinition(partitionKey, partitionKeyProperty) as PartitionKeyDefinition
    );

    const partitionKeyValue = partitionKeyArray && partitionKeyArray[0];
    const selectedDocumentId = new DocumentId(
      this.props as DocumentsTab,
      this.state.selectedSqlDocumentId,
      partitionKeyValue
    );

    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteDocument, {
      dataExplorerArea: Areas.Tab,
      tabTitle: tabTitle(),
    });

    if (window.confirm(msg)) {
      try {
        isExecuting(true);
        if (userContext.apiType === "Mongo") {
          await deleteDocument(
            collection.databaseId,
            collection as ViewModels.Collection,
            this.state.selectedDocumentId
          );
        } else {
          await deleteSqlDocument(collection as ViewModels.Collection, selectedDocumentId);
        }
        TelemetryProcessor.traceSuccess(
          Action.DeleteDocument,
          {
            dataExplorerArea: Areas.Tab,
            tabTitle: tabTitle(),
          },
          startKey
        );
        this.setState({ isEditorVisible: false });
        isExecuting(false);
        this.querySqlDocumentsData();
      } catch (error) {
        isExecutionError(true);
        isExecuting(false);
        TelemetryProcessor.traceFailure(
          Action.DeleteDocument,
          {
            dataExplorerArea: Areas.Tab,
            tabTitle: tabTitle(),
            error: getErrorMessage(error),
            errorStack: getErrorStack(error),
          },
          startKey
        );
      }
    }
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
    } else {
      this.onSaveSqlNewMongoDocumentClick();
    }
  };

  public onSaveSqlNewMongoDocumentClick = async (): Promise<void> => {
    const { isExecutionError, tabTitle, isExecuting, collection } = this.props;
    isExecutionError(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDocument, {
      dataExplorerArea: Areas.Tab,
      tabTitle: tabTitle(),
    });
    const document = JSON.parse(this.state.documentContent);

    isExecuting(true);

    try {
      const savedDocument = await createSqlDocuments(collection, document);
      if (savedDocument) {
        this.handleRowContent(savedDocument as Resource);
        TelemetryProcessor.traceSuccess(
          Action.CreateDocument,
          {
            dataExplorerArea: Areas.Tab,
            tabTitle: tabTitle(),
          },
          startKey
        );
      }
      isExecuting(false);
      this.querySqlDocumentsData();
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
        collection as ViewModels.Collection,
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
      this.setState({ isEditorContentEdited: false });
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
    this.setState({
      isEditorVisible: false,
      isEditorContentEdited: false,
    });
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
    userContext.apiType === "Mongo" ? this.queryDocumentsData() : this.querySqlDocumentsData();
    this.setState({
      isSuggestionVisible: false,
      isAllDocumentsVisible: true,
    });
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
    }

    this.setState(
      {
        documentContent: newContent,
        isEditorContentEdited: true,
      },
      () => {
        this.updateTabButton();
      }
    );
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
      documentSqlIds,
      editorKey,
      isAllDocumentsVisible,
    } = this.state;

    const isPreferredApiMongoDB = userContext.apiType === "Mongo";
    return (
      <div>
        {isFilterOptionVisible && (
          <div>
            <div>
              <Stack horizontal verticalFill wrap>
                {!isPreferredApiMongoDB && <Text className="queryText">SELECT * FROM c</Text>}
                <TextField
                  iconProps={filterIcon}
                  placeholder={getFilterPlaceholder(isPreferredApiMongoDB)}
                  className={isPreferredApiMongoDB ? "documentTabSearchBar" : "documentSqlTabSearchBar"}
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
              <div className={isPreferredApiMongoDB ? "filterSuggestions" : "filterSuggestions sqlFilterSuggestions"}>
                <List items={getFilterSuggestions(isPreferredApiMongoDB)} onRenderCell={this.onRenderCell} />
              </div>
            )}
          </div>
        )}
        {!isFilterOptionVisible && (
          <Stack horizontal verticalFill wrap className="documentTabNoFilterView">
            <Text className="noFilterText">{isPreferredApiMongoDB ? "No filter applied" : "Select * from C"}</Text>
            <PrimaryButton text="Edit Filter" onClick={() => this.setState({ isFilterOptionVisible: true })} />
          </Stack>
        )}
        <div className="splitterWrapper" onClick={() => this.setState({ isSuggestionVisible: false })}>
          <SplitterLayout primaryIndex={0} secondaryInitialSize={1000}>
            <div className="leftSplitter">
              <DetailsList
                items={getDocumentItems(isPreferredApiMongoDB, documentIds, documentSqlIds, isAllDocumentsVisible)}
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
