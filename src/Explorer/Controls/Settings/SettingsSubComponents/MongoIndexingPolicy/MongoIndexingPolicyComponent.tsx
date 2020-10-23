import * as React from "react";
import {
  DetailsList,
  DetailsListLayoutMode,
  Stack,
  IconButton,
  Text,
  SelectionMode,
  IDetailsRowProps,
  DetailsRow,
  IColumn,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Link,
  Separator
} from "office-ui-fabric-react";
import {
  addMongoIndexStackProps,
  customDetailsListStyles,
  mongoIndexingPolicyDisclaimer,
  mediumWidthStackStyles,
  subComponentStackProps,
  transparentDetailsRowStyles,
  createAndAddMongoIndexStackProps,
  mongoWarningStackProps,
  separatorStyles
} from "../../SettingsRenderUtils";
import { MongoIndex } from "../../../../../Utils/arm/generatedClients/2020-04-01/types";
import {
  MongoIndexTypes,
  AddMongoIndexProps,
  MongoIndexIdField,
  MongoNotificationType,
  getMongoIndexType,
  getMongoIndexTypeText
} from "../../SettingsUtils";
import { AddMongoIndexComponent } from "./AddMongoIndexComponent";
import { CollapsibleSectionComponent } from "../../../CollapsiblePanel/CollapsibleSectionComponent";

export interface MongoIndexingPolicyComponentProps {
  mongoIndexes: MongoIndex[];
  onIndexDrop: (index: number) => void;
  indexesToDrop: number[];
  onRevertIndexDrop: (index: number) => void;
  indexesToAdd: AddMongoIndexProps[];
  onRevertIndexAdd: (index: number) => void;
  onIndexAddOrChange: (index: number, description: string, type: MongoIndexTypes) => void;
  indexTransformationProgress: number;
  refreshIndexTransformationProgress: () => Promise<void>;
  onMongoIndexingPolicySaveableChange: (isMongoIndexingPolicySaveable: boolean) => void;
  onMongoIndexingPolicyDiscardableChange: (isMongoIndexingPolicyDiscardable: boolean) => void;
}

interface MongoIndexingPolicyComponentState {
  isRefreshingIndexTransformationProgress: boolean;
}

interface MongoIndexDisplayProps {
  definition: JSX.Element;
  type: JSX.Element;
  actionButton: JSX.Element;
}

export class MongoIndexingPolicyComponent extends React.Component<
  MongoIndexingPolicyComponentProps,
  MongoIndexingPolicyComponentState
> {
  private shouldCheckComponentIsDirty = true;
  private addMongoIndexComponentRefs: React.RefObject<AddMongoIndexComponent>[] = [];
  private initialIndexesColumns: IColumn[] = [
    { key: "definition", name: "Definition", fieldName: "definition", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "type", name: "Type", fieldName: "type", minWidth: 100, maxWidth: 200, isResizable: true },
    {
      key: "actionButton",
      name: "Drop Index",
      fieldName: "actionButton",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true
    }
  ];

  private indexesToBeDroppedColumns: IColumn[] = [
    { key: "definition", name: "Definition", fieldName: "definition", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "type", name: "Type", fieldName: "type", minWidth: 100, maxWidth: 200, isResizable: true },
    {
      key: "actionButton",
      name: "Add index back",
      fieldName: "actionButton",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true
    }
  ];

  constructor(props: MongoIndexingPolicyComponentProps) {
    super(props);
    this.state = {
      isRefreshingIndexTransformationProgress: false
    };
  }

  componentDidUpdate(prevProps: MongoIndexingPolicyComponentProps): void {
    if (this.props.indexesToAdd.length > prevProps.indexesToAdd.length) {
      this.addMongoIndexComponentRefs[prevProps.indexesToAdd.length]?.current?.focus();
    }
    this.onComponentUpdate();
  }

  componentDidMount(): void {
    this.onComponentUpdate();
  }

  private onComponentUpdate = (): void => {
    if (!this.shouldCheckComponentIsDirty) {
      this.shouldCheckComponentIsDirty = true;
      return;
    }
    this.props.onMongoIndexingPolicySaveableChange(this.isMongoIndexingPolicySaveable());
    this.props.onMongoIndexingPolicyDiscardableChange(this.isMongoIndexingPolicyDiscardable());
    this.shouldCheckComponentIsDirty = false;
  };

  public isMongoIndexingPolicySaveable = (): boolean => {
    if (this.props.indexesToAdd.length === 0 && this.props.indexesToDrop.length === 0) {
      return false;
    }

    const addErrorsExist = !!this.props.indexesToAdd.find(addMongoIndexProps => addMongoIndexProps.notification);

    if (addErrorsExist) {
      return false;
    }

    return true;
  };

  public isMongoIndexingPolicyDiscardable = (): boolean => {
    return this.props.indexesToAdd.length > 0 || this.props.indexesToDrop.length > 0;
  };

  public getMongoWarningNotificationMessage = (): string => {
    return this.props.indexesToAdd.find(
      addMongoIndexProps => addMongoIndexProps.notification?.type === MongoNotificationType.Warning
    )?.notification.message;
  };

  private onRenderRow = (props: IDetailsRowProps): JSX.Element => {
    return <DetailsRow {...props} styles={transparentDetailsRowStyles} />;
  };

  private getActionButton = (arrayPosition: number, isCurrentIndex: boolean): JSX.Element => {
    return isCurrentIndex ? (
      <IconButton
        ariaLabel="Delete index Button"
        iconProps={{ iconName: "Delete" }}
        disabled={this.isIndexingTransforming()}
        onClick={() => {
          this.props.onIndexDrop(arrayPosition);
        }}
      />
    ) : (
      <IconButton
        ariaLabel="Add back Index Button"
        iconProps={{ iconName: "Add" }}
        onClick={() => {
          this.props.onRevertIndexDrop(arrayPosition);
        }}
      />
    );
  };

  private getMongoIndexDisplayProps = (
    mongoIndex: MongoIndex,
    arrayPosition: number,
    isCurrentIndex: boolean
  ): MongoIndexDisplayProps => {
    const keys = mongoIndex?.key?.keys;
    const type = getMongoIndexType(keys);
    const definition = keys?.join();
    let mongoIndexDisplayProps: MongoIndexDisplayProps;
    if (type) {
      mongoIndexDisplayProps = {
        definition: <Text>{definition}</Text>,
        type: <Text>{getMongoIndexTypeText(type)}</Text>,
        actionButton: definition === MongoIndexIdField ? <></> : this.getActionButton(arrayPosition, isCurrentIndex)
      };
    }
    return mongoIndexDisplayProps;
  };

  private renderIndexesToBeAdded = (): JSX.Element => {
    const indexesToAddLength = this.props.indexesToAdd.length;
    for (let i = 0; i < indexesToAddLength; i++) {
      const existingIndexToAddRef = React.createRef<AddMongoIndexComponent>();
      this.addMongoIndexComponentRefs[i] = existingIndexToAddRef;
    }
    const newIndexToAddRef = React.createRef<AddMongoIndexComponent>();
    this.addMongoIndexComponentRefs[indexesToAddLength] = newIndexToAddRef;

    return (
      <Stack {...addMongoIndexStackProps} styles={mediumWidthStackStyles}>
        {this.props.indexesToAdd.map((mongoIndexWithType, arrayPosition) => {
          const keys = mongoIndexWithType.mongoIndex.key.keys;
          const type = mongoIndexWithType.type;
          const notification = mongoIndexWithType.notification;
          return (
            <AddMongoIndexComponent
              ref={this.addMongoIndexComponentRefs[arrayPosition]}
              position={arrayPosition}
              key={arrayPosition}
              description={keys.join()}
              type={type}
              notification={notification}
              onIndexAddOrChange={(description, type) =>
                this.props.onIndexAddOrChange(arrayPosition, description, type)
              }
              onDiscard={() => {
                this.addMongoIndexComponentRefs.splice(arrayPosition, 1);
                this.props.onRevertIndexAdd(arrayPosition);
              }}
            />
          );
        })}

        <AddMongoIndexComponent
          ref={this.addMongoIndexComponentRefs[indexesToAddLength]}
          disabled={this.isIndexingTransforming()}
          position={indexesToAddLength}
          key={indexesToAddLength}
          description={undefined}
          type={undefined}
          notification={undefined}
          onIndexAddOrChange={(description, type) =>
            this.props.onIndexAddOrChange(indexesToAddLength, description, type)
          }
          onDiscard={() => {
            this.props.onRevertIndexAdd(indexesToAddLength);
          }}
        />
      </Stack>
    );
  };

  private renderInitialIndexes = (): JSX.Element => {
    const initialIndexes = this.props.mongoIndexes
      .map((mongoIndex, arrayPosition) => this.getMongoIndexDisplayProps(mongoIndex, arrayPosition, true))
      .filter((value, arrayPosition) => !!value && !this.props.indexesToDrop.includes(arrayPosition));

    return (
      <Stack {...createAndAddMongoIndexStackProps} styles={mediumWidthStackStyles}>
        <CollapsibleSectionComponent title="Current index(es)">
          {
            <>
              <DetailsList
                styles={customDetailsListStyles}
                disableSelectionZone
                items={initialIndexes}
                columns={this.initialIndexesColumns}
                selectionMode={SelectionMode.none}
                onRenderRow={this.onRenderRow}
                layoutMode={DetailsListLayoutMode.justified}
              />
              {this.renderIndexesToBeAdded()}
            </>
          }
        </CollapsibleSectionComponent>
      </Stack>
    );
  };

  private renderIndexesToBeDropped = (): JSX.Element => {
    const indexesToBeDropped = this.props.indexesToDrop.map((dropIndex, arrayPosition) =>
      this.getMongoIndexDisplayProps(this.props.mongoIndexes[dropIndex], arrayPosition, false)
    );

    return (
      <Stack styles={mediumWidthStackStyles}>
        <CollapsibleSectionComponent title="Index(es) to be dropped">
          {indexesToBeDropped.length > 0 && (
            <DetailsList
              styles={customDetailsListStyles}
              disableSelectionZone
              items={indexesToBeDropped}
              columns={this.indexesToBeDroppedColumns}
              selectionMode={SelectionMode.none}
              onRenderRow={this.onRenderRow}
              layoutMode={DetailsListLayoutMode.justified}
            />
          )}
        </CollapsibleSectionComponent>
      </Stack>
    );
  };

  private refreshIndexTransformationProgress = async () => {
    this.setState({ isRefreshingIndexTransformationProgress: true });
    try {
      await this.props.refreshIndexTransformationProgress();
    } finally {
      this.setState({ isRefreshingIndexTransformationProgress: false });
    }
  };

  public isIndexingTransforming = (): boolean =>
    this.props.indexTransformationProgress !== undefined && this.props.indexTransformationProgress !== 100;

  private onClickRefreshIndexingTransformationLink = async () => await this.refreshIndexTransformationProgress();

  private renderIndexTransformationWarning = (): JSX.Element => {
    if (this.state.isRefreshingIndexTransformationProgress) {
      return (
        <Stack horizontal {...mongoWarningStackProps}>
          <Text>Refreshing indexing policy update information</Text>
          <Spinner size={SpinnerSize.medium} />
        </Stack>
      );

      // index transformation progress can be 0
    } else if (this.isIndexingTransforming()) {
      const updateInfoString = "The indexing policy is being updated in the background. ";

      if (this.props.indexTransformationProgress === 0) {
        return (
          <Text>
            {updateInfoString}
            <Link onClick={this.onClickRefreshIndexingTransformationLink}>
              {`Refresh to check if it has completed.`}
            </Link>
          </Text>
        );
      } else {
        return (
          <Text>
            {updateInfoString} The update is {this.props.indexTransformationProgress}% complete.
            <Link onClick={this.onClickRefreshIndexingTransformationLink}>{` Refresh to check the progress.`}</Link>
          </Text>
        );
      }
    }

    return undefined;
  };

  private renderWarningMessage = (): JSX.Element => {
    let warningMessage: string;
    if (this.getMongoWarningNotificationMessage()) {
      warningMessage = this.getMongoWarningNotificationMessage();
    } else if (this.isMongoIndexingPolicySaveable()) {
      warningMessage =
        "You have not saved the latest changes made to your indexing policy. Please click save to confirm the changes.";
    }

    return (
      <>
        {this.renderIndexTransformationWarning() && (
          <MessageBar messageBarType={MessageBarType.warning}>{this.renderIndexTransformationWarning()}</MessageBar>
        )}

        {warningMessage && (
          <MessageBar messageBarType={MessageBarType.warning}>
            <Text>{warningMessage}</Text>
          </MessageBar>
        )}
      </>
    );
  };

  public render(): JSX.Element {
    return this.props.mongoIndexes ? (
      <Stack {...subComponentStackProps}>
        {this.renderWarningMessage()}
        {mongoIndexingPolicyDisclaimer}
        {this.renderInitialIndexes()}
        <Separator styles={separatorStyles} />
        {this.renderIndexesToBeDropped()}
      </Stack>
    ) : (
      <Spinner size={SpinnerSize.large} />
    );
  }
}
