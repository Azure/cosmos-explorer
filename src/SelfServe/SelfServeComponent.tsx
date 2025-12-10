import {
  CommandBar,
  ICommandBarItemProps,
  MessageBar,
  MessageBarType,
  Separator,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
} from "@fluentui/react";
import { TFunction } from "i18next";
import promiseRetry, { AbortError, Options } from "p-retry";
import React from "react";
import { WithTranslation } from "react-i18next";
import * as _ from "underscore";
import { sendMessage } from "../Common/MessageHandler";
import { SelfServeMessageTypes } from "../Contracts/SelfServeContracts";
import { SmartUiComponent, SmartUiDescriptor } from "../Explorer/Controls/SmartUi/SmartUiComponent";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import { trace } from "../Shared/Telemetry/TelemetryProcessor";
import { commandBarItemStyles, commandBarStyles, containerStackTokens, separatorStyles } from "./SelfServeStyles";
import {
  AnyDisplay,
  BooleanInput,
  ChoiceInput,
  DescriptionDisplay,
  InputType,
  Node,
  NumberInput,
  RefreshResult,
  SelfServeComponentTelemetryType,
  SelfServeDescriptor,
  SmartUiInput,
  StringInput,
} from "./SelfServeTypes";

interface SelfServeNotification {
  message: string;
  type: MessageBarType;
  isCancellable: boolean;
}

interface PortalNotificationContent {
  retryIntervalInMs: number;
  operationStatusUrl: string;
  portalNotification?: {
    initialize: {
      title: string;
      message: string;
    };
    success: {
      title: string;
      message: string;
    };
    failure: {
      title: string;
      message: string;
    };
  };
}

export interface SelfServeComponentProps extends WithTranslation {
  descriptor: SelfServeDescriptor;
}

export interface SelfServeComponentState {
  root: SelfServeDescriptor;
  currentValues: Map<string, SmartUiInput>;
  baselineValues: Map<string, SmartUiInput>;
  isInitializing: boolean;
  isSaving: boolean;
  hasErrors: boolean;
  compileErrorMessage: string;
  refreshResult: RefreshResult;
  notification: SelfServeNotification;
}

export class SelfServeComponent extends React.Component<SelfServeComponentProps, SelfServeComponentState> {
  private static readonly defaultRetryIntervalInMs = 30000;
  private smartUiGeneratorClassName: string;
  private retryIntervalInMs: number;
  private retryOptions: Options;
  private translationFunction: TFunction;

  componentDidMount(): void {
    this.performRefresh().then(() => {
      if (this.state.refreshResult?.isUpdateInProgress) {
        promiseRetry(() => this.pollRefresh(), this.retryOptions);
      }
    });
    this.initializeSmartUiComponent();

    const telemetryData = {
      selfServeClassName: this.props.descriptor.root.id,
      eventType: SelfServeComponentTelemetryType.Load,
    };
    trace(Action.SelfServeComponent, ActionModifiers.Mark, telemetryData, SelfServeMessageTypes.TelemetryInfo);
  }

  constructor(props: SelfServeComponentProps) {
    super(props);
    this.state = {
      root: this.props.descriptor,
      currentValues: new Map(),
      baselineValues: new Map(),
      isInitializing: true,
      isSaving: false,
      hasErrors: false,
      compileErrorMessage: undefined,
      refreshResult: undefined,
      notification: undefined,
    };
    this.smartUiGeneratorClassName = this.props.descriptor.root.id;
    this.retryIntervalInMs = this.props.descriptor.refreshParams?.retryIntervalInMs;
    if (!this.retryIntervalInMs) {
      this.retryIntervalInMs = SelfServeComponent.defaultRetryIntervalInMs;
    }
    this.retryOptions = { forever: true, maxTimeout: this.retryIntervalInMs, minTimeout: this.retryIntervalInMs };

    // translation function passed to SelfServeComponent
    this.translationFunction = this.props.t;
  }

  private onError = (hasErrors: boolean): void => {
    this.setState({ hasErrors });
  };

  private initializeSmartUiComponent = async (): Promise<void> => {
    this.setState({ isInitializing: true });
    await this.setDefaults();
    const { currentValues, baselineValues } = this.state;
    await this.initializeSmartUiNode(this.props.descriptor.root, currentValues, baselineValues);
    this.setState({ isInitializing: false, currentValues, baselineValues });
  };

  private setDefaults = async (): Promise<void> => {
    let { currentValues, baselineValues } = this.state;

    const initialValues = await this.props.descriptor.initialize();
    this.props.descriptor.inputNames.map((inputName) => {
      const initialValue = initialValues.get(inputName);
      currentValues = currentValues.set(inputName, initialValue);
      baselineValues = baselineValues.set(inputName, initialValue);
      initialValues.delete(inputName);
    });

    if (initialValues.size > 0) {
      const keys = [];
      for (const key of initialValues.keys()) {
        keys.push(key);
      }

      this.setState({
        compileErrorMessage: `The following fields have default values set but are not input properties of this class: ${keys.join(
          ", ",
        )}`,
      });
    }
    this.setState({ currentValues, baselineValues });
  };

  public updateBaselineValues = (): void => {
    const currentValues = this.state.currentValues;
    let baselineValues = this.state.baselineValues;
    for (const key of currentValues.keys()) {
      const currentValue = currentValues.get(key);
      baselineValues = baselineValues.set(key, { ...currentValue });
    }
    this.setState({ baselineValues });
  };

  public discard = (): void => {
    let { currentValues } = this.state;
    const { baselineValues } = this.state;
    for (const key of currentValues.keys()) {
      const baselineValue = baselineValues.get(key);
      currentValues = currentValues.set(key, baselineValue ? { ...baselineValue } : baselineValue);
    }
    this.setState({ currentValues });
  };

  private initializeSmartUiNode = async (
    currentNode: Node,
    currentValues: Map<string, SmartUiInput>,
    baselineValues: Map<string, SmartUiInput>,
  ): Promise<void> => {
    currentNode.info = await this.getResolvedValue(currentNode.info);

    if (currentNode.input) {
      currentNode.input = await this.getResolvedInput(currentNode.input, currentValues, baselineValues);
    }

    const promises = currentNode.children?.map(
      async (child: Node) => await this.initializeSmartUiNode(child, currentValues, baselineValues),
    );
    if (promises) {
      await Promise.all(promises);
    }
  };

  private getResolvedInput = async (
    input: AnyDisplay,
    currentValues: Map<string, SmartUiInput>,
    baselineValues: Map<string, SmartUiInput>,
  ): Promise<AnyDisplay> => {
    input.labelTKey = await this.getResolvedValue(input.labelTKey);
    input.placeholderTKey = await this.getResolvedValue(input.placeholderTKey);

    switch (input.type) {
      case "string": {
        if ("description" in input) {
          const descriptionDisplay = input as DescriptionDisplay;
          descriptionDisplay.description = await this.getResolvedValue(descriptionDisplay.description);
        }
        return input as StringInput;
      }
      case "number": {
        const numberInput = input as NumberInput;
        numberInput.min = await this.getResolvedValue(numberInput.min);
        numberInput.max = await this.getResolvedValue(numberInput.max);
        numberInput.step = await this.getResolvedValue(numberInput.step);

        const dataFieldName = numberInput.dataFieldName;
        const defaultValue = currentValues.get(dataFieldName)?.value;

        if (!defaultValue) {
          const newDefaultValue = { value: numberInput.min, hidden: currentValues.get(dataFieldName)?.hidden };
          currentValues.set(dataFieldName, newDefaultValue);
          baselineValues.set(dataFieldName, newDefaultValue);
        }

        return numberInput;
      }
      case "boolean": {
        const booleanInput = input as BooleanInput;
        booleanInput.trueLabelTKey = await this.getResolvedValue(booleanInput.trueLabelTKey);
        booleanInput.falseLabelTKey = await this.getResolvedValue(booleanInput.falseLabelTKey);
        return booleanInput;
      }
      default: {
        const choiceInput = input as ChoiceInput;
        choiceInput.choices = await this.getResolvedValue(choiceInput.choices);
        return choiceInput;
      }
    }
  };

  public async getResolvedValue<T>(value: T | (() => Promise<T>)): Promise<T> {
    if (value instanceof Function) {
      return value();
    }
    return value;
  }

  private onInputChange = (input: AnyDisplay, newValue: InputType) => {
    if (input.onChange) {
      const newValues = input.onChange(
        newValue,
        this.state.currentValues,
        this.state.baselineValues as ReadonlyMap<string, SmartUiInput>,
      );
      this.setState({ currentValues: newValues });
    } else {
      const dataFieldName = input.dataFieldName;
      const { currentValues } = this.state;
      const currentInputValue = currentValues.get(dataFieldName);
      currentValues.set(dataFieldName, { value: newValue, hidden: currentInputValue?.hidden });
      this.setState({ currentValues });
    }
  };

  public performSave = async (): Promise<void> => {
    const telemetryData = {
      selfServeClassName: this.props.descriptor.root.id,
      eventType: SelfServeComponentTelemetryType.Save,
    };
    trace(Action.SelfServeComponent, ActionModifiers.Mark, telemetryData, SelfServeMessageTypes.TelemetryInfo);

    this.setState({ isSaving: true, notification: undefined });
    try {
      const onSaveResult = await this.props.descriptor.onSave(
        this.state.currentValues,
        this.state.baselineValues as ReadonlyMap<string, SmartUiInput>,
      );
      if (onSaveResult.portalNotification) {
        const requestInitializedPortalNotification = onSaveResult.portalNotification.initialize;
        const requestSucceededPortalNotification = onSaveResult.portalNotification.success;
        const requestFailedPortalNotification = onSaveResult.portalNotification.failure;

        this.sendNotificationMessage({
          retryIntervalInMs: this.retryIntervalInMs,
          operationStatusUrl: onSaveResult.operationStatusUrl,
          portalNotification: {
            initialize: {
              title: this.getTranslation(requestInitializedPortalNotification.titleTKey),
              message: this.getTranslation(requestInitializedPortalNotification.messageTKey),
            },
            success: {
              title: this.getTranslation(requestSucceededPortalNotification.titleTKey),
              message: this.getTranslation(requestSucceededPortalNotification.messageTKey),
            },
            failure: {
              title: this.getTranslation(requestFailedPortalNotification.titleTKey),
              message: this.getTranslation(requestFailedPortalNotification.messageTKey),
            },
          },
        });
      }
      promiseRetry(() => this.pollRefresh(), this.retryOptions);
    } catch (error) {
      this.setState({
        notification: {
          type: MessageBarType.error,
          isCancellable: true,
          message: this.getTranslation(error.message),
        },
      });
      throw error;
    } finally {
      this.setState({ isSaving: false });
    }
    await this.onRefreshClicked();
    this.updateBaselineValues();
  };

  public onSaveButtonClick = (): void => {
    this.performSave();
  };

  public isInputModified = (): boolean => {
    for (const key of this.state.currentValues.keys()) {
      const currentValue = this.state.currentValues.get(key);
      if (currentValue && currentValue.hidden === undefined) {
        currentValue.hidden = false;
      }
      if (currentValue && currentValue.disabled === undefined) {
        currentValue.disabled = false;
      }

      const baselineValue = this.state.baselineValues.get(key);
      if (baselineValue && baselineValue.hidden === undefined) {
        baselineValue.hidden = false;
      }
      if (baselineValue && baselineValue.disabled === undefined) {
        baselineValue.disabled = false;
      }

      if (!_.isEqual(currentValue, baselineValue)) {
        return true;
      }
    }
    return false;
  };

  public isRefreshing = (): boolean => {
    return this.state.isSaving || this.state.isInitializing || this.state.refreshResult?.isUpdateInProgress;
  };

  public isDiscardButtonDisabled = (): boolean => {
    return this.isRefreshing() || !this.isInputModified();
  };

  public isSaveButtonDisabled = (): boolean => {
    return this.state.hasErrors || this.isRefreshing() || !this.isInputModified();
  };

  private performRefresh = async (): Promise<void> => {
    const refreshResult = await this.props.descriptor.onRefresh();
    let updateInProgressNotification: SelfServeNotification;
    if (this.state.refreshResult?.isUpdateInProgress && !refreshResult.isUpdateInProgress) {
      await this.initializeSmartUiComponent();
    }
    if (refreshResult.isUpdateInProgress) {
      updateInProgressNotification = {
        type: MessageBarType.info,
        isCancellable: false,
        message: this.getTranslation(refreshResult.updateInProgressMessageTKey),
      };
    }
    this.setState({
      refreshResult: { ...refreshResult },
      notification: updateInProgressNotification,
    });
  };

  public onRefreshClicked = async (): Promise<void> => {
    this.setState({ isInitializing: true });
    await this.performRefresh();
    this.setState({ isInitializing: false });
  };

  public pollRefresh = async (): Promise<void> => {
    try {
      await this.performRefresh();
    } catch (error) {
      throw new AbortError(error);
    }
    const refreshResult = this.state.refreshResult;
    if (refreshResult.isUpdateInProgress) {
      throw new Error("update in progress. retrying ...");
    }
  };

  public getCommonTranslation = (key: string): string => {
    return this.getTranslation(key, "Common");
  };

  private getTranslation = (messageKey: string, namespace = `${this.smartUiGeneratorClassName}`): string => {
    const translationKey = `${namespace}:${messageKey}`;
    const translation = this.translationFunction ? this.translationFunction(translationKey) : messageKey;
    if (translation === translationKey) {
      return messageKey;
    }
    return translation;
  };

  private getCommandBarItems = (): ICommandBarItemProps[] => {
    return [
      {
        key: "save",
        text: this.getCommonTranslation("Save"),
        iconProps: { iconName: "Save" },
        disabled: this.isSaveButtonDisabled(),
        onClick: () => this.onSaveButtonClick(),
      },
      {
        key: "discard",
        text: this.getCommonTranslation("Discard"),
        iconProps: { iconName: "Undo" },
        disabled: this.isDiscardButtonDisabled(),
        onClick: () => {
          this.discard();
        },
        buttonStyles: commandBarItemStyles,
      },
      {
        key: "refresh",
        text: this.getCommonTranslation("Refresh"),
        disabled: this.state.isInitializing,
        iconProps: { iconName: "Refresh" },
        onClick: () => {
          this.onRefreshClicked();
        },
        buttonStyles: commandBarItemStyles,
      },
    ];
  };

  private sendNotificationMessage = (portalNotificationContent: PortalNotificationContent): void => {
    sendMessage({
      type: SelfServeMessageTypes.Notification,
      data: { portalNotificationContent },
    });
  };

  public render(): JSX.Element {
    if (this.state.compileErrorMessage) {
      return (
        <MessageBar messageBarType={MessageBarType.error}>
          <Text>{this.state.compileErrorMessage}</Text>
        </MessageBar>
      );
    }
    return (
      <div style={{ overflowX: "auto" }} data-testid="DataExplorerRoot">
        <Stack tokens={containerStackTokens}>
          <Stack.Item>
            <CommandBar styles={commandBarStyles} items={this.getCommandBarItems()} />
            <Separator styles={separatorStyles} />
          </Stack.Item>
          {this.state.isInitializing ? (
            <Spinner size={SpinnerSize.large} />
          ) : (
            <>
              {this.state.notification && (
                <MessageBar
                  messageBarType={this.state.notification.type}
                  onDismiss={
                    this.state.notification.isCancellable ? () => this.setState({ notification: undefined }) : undefined
                  }
                >
                  <Text>{this.state.notification.message}</Text>
                </MessageBar>
              )}
              <SmartUiComponent
                disabled={this.state.refreshResult?.isUpdateInProgress || this.state.isSaving}
                descriptor={this.state.root as SmartUiDescriptor}
                currentValues={this.state.currentValues}
                onInputChange={this.onInputChange}
                onError={this.onError}
                getTranslation={this.getTranslation}
              />
            </>
          )}
        </Stack>
      </div>
    );
  }
}
