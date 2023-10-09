import {
  Checkbox,
  ChoiceGroup,
  IChoiceGroupOption,
  ISpinButtonStyles,
  IToggleStyles,
  Position,
  SpinButton,
  Toggle,
} from "@fluentui/react";
import * as Constants from "Common/Constants";
import { InfoTooltip } from "Common/Tooltip/InfoTooltip";
import { configContext } from "ConfigContext";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import * as StringUtility from "Shared/StringUtility";
import { userContext } from "UserContext";
import { logConsoleInfo } from "Utils/NotificationConsoleUtils";
import * as PriorityBasedExecutionUtils from "Utils/PriorityBasedExecutionUtils";
import { useSidePanel } from "hooks/useSidePanel";
import React, { FunctionComponent, useState } from "react";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export const SettingsPane: FunctionComponent = () => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [pageOption, setPageOption] = useState<string>(
    LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage) === Constants.Queries.unlimitedItemsPerPage
      ? Constants.Queries.UnlimitedPageOption
      : Constants.Queries.CustomPageOption,
  );
  const [queryTimeoutEnabled, setQueryTimeoutEnabled] = useState<boolean>(
    LocalStorageUtility.getEntryBoolean(StorageKey.QueryTimeoutEnabled),
  );
  const [queryTimeout, setQueryTimeout] = useState<number>(LocalStorageUtility.getEntryNumber(StorageKey.QueryTimeout));
  const [customItemPerPage, setCustomItemPerPage] = useState<number>(
    LocalStorageUtility.getEntryNumber(StorageKey.CustomItemPerPage) || 0,
  );
  const [containerPaginationEnabled, setContainerPaginationEnabled] = useState<boolean>(
    LocalStorageUtility.hasItem(StorageKey.ContainerPaginationEnabled)
      ? LocalStorageUtility.getEntryString(StorageKey.ContainerPaginationEnabled) === "true"
      : false,
  );
  const [crossPartitionQueryEnabled, setCrossPartitionQueryEnabled] = useState<boolean>(
    LocalStorageUtility.hasItem(StorageKey.IsCrossPartitionQueryEnabled)
      ? LocalStorageUtility.getEntryString(StorageKey.IsCrossPartitionQueryEnabled) === "true"
      : false,
  );
  const [graphAutoVizDisabled, setGraphAutoVizDisabled] = useState<string>(
    LocalStorageUtility.hasItem(StorageKey.IsGraphAutoVizDisabled)
      ? LocalStorageUtility.getEntryString(StorageKey.IsGraphAutoVizDisabled)
      : "false",
  );
  const [maxDegreeOfParallelism, setMaxDegreeOfParallelism] = useState<number>(
    LocalStorageUtility.hasItem(StorageKey.MaxDegreeOfParellism)
      ? LocalStorageUtility.getEntryNumber(StorageKey.MaxDegreeOfParellism)
      : Constants.Queries.DefaultMaxDegreeOfParallelism,
  );
  const [priorityLevel, setPriorityLevel] = useState<string>(
    LocalStorageUtility.hasItem(StorageKey.PriorityLevel)
      ? LocalStorageUtility.getEntryString(StorageKey.PriorityLevel)
      : Constants.PriorityLevel.Default,
  );
  const explorerVersion = configContext.gitSha;
  const shouldShowQueryPageOptions = userContext.apiType === "SQL";
  const shouldShowGraphAutoVizOption = userContext.apiType === "Gremlin";
  const shouldShowCrossPartitionOption = userContext.apiType !== "Gremlin";
  const shouldShowParallelismOption = userContext.apiType !== "Gremlin";
  const shouldShowPriorityLevelOption = PriorityBasedExecutionUtils.isFeatureEnabled();
  const handlerOnSubmit = () => {
    setIsExecuting(true);

    LocalStorageUtility.setEntryNumber(
      StorageKey.ActualItemPerPage,
      isCustomPageOptionSelected() ? customItemPerPage : Constants.Queries.unlimitedItemsPerPage,
    );
    LocalStorageUtility.setEntryNumber(StorageKey.CustomItemPerPage, customItemPerPage);
    LocalStorageUtility.setEntryBoolean(StorageKey.QueryTimeoutEnabled, queryTimeoutEnabled);
    LocalStorageUtility.setEntryString(StorageKey.ContainerPaginationEnabled, containerPaginationEnabled.toString());
    LocalStorageUtility.setEntryString(StorageKey.IsCrossPartitionQueryEnabled, crossPartitionQueryEnabled.toString());
    LocalStorageUtility.setEntryNumber(StorageKey.MaxDegreeOfParellism, maxDegreeOfParallelism);
    LocalStorageUtility.setEntryString(StorageKey.PriorityLevel, priorityLevel.toString());

    if (shouldShowGraphAutoVizOption) {
      LocalStorageUtility.setEntryBoolean(
        StorageKey.IsGraphAutoVizDisabled,
        StringUtility.toBoolean(graphAutoVizDisabled),
      );
    }

    if (queryTimeoutEnabled) {
      LocalStorageUtility.setEntryNumber(StorageKey.QueryTimeout, queryTimeout);
    }

    setIsExecuting(false);
    logConsoleInfo(
      `Updated items per page setting to ${LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage)}`,
    );
    logConsoleInfo(`${crossPartitionQueryEnabled ? "Enabled" : "Disabled"} cross-partition query feed option`);
    logConsoleInfo(
      `Updated the max degree of parallelism query feed option to ${LocalStorageUtility.getEntryNumber(
        StorageKey.MaxDegreeOfParellism,
      )}`,
    );
    logConsoleInfo(`Updated priority level setting to ${LocalStorageUtility.getEntryString(StorageKey.PriorityLevel)}`);

    if (shouldShowGraphAutoVizOption) {
      logConsoleInfo(
        `Graph result will be displayed as ${
          LocalStorageUtility.getEntryBoolean(StorageKey.IsGraphAutoVizDisabled) ? "JSON" : "Graph"
        }`,
      );
    }

    logConsoleInfo(
      `Updated query setting to ${LocalStorageUtility.getEntryString(StorageKey.SetPartitionKeyUndefined)}`,
    );
    closeSidePanel();
  };

  const isCustomPageOptionSelected = () => {
    return pageOption === Constants.Queries.CustomPageOption;
  };

  const handleOnGremlinChange = (ev: React.FormEvent<HTMLInputElement>, option: IChoiceGroupOption): void => {
    setGraphAutoVizDisabled(option.key);
  };

  const genericPaneProps: RightPaneFormProps = {
    formError: "",
    isExecuting,
    submitButtonText: "Apply",
    onSubmit: () => handlerOnSubmit(),
  };
  const pageOptionList: IChoiceGroupOption[] = [
    { key: Constants.Queries.CustomPageOption, text: "Custom" },
    { key: Constants.Queries.UnlimitedPageOption, text: "Unlimited" },
  ];

  const graphAutoOptionList: IChoiceGroupOption[] = [
    { key: "false", text: "Graph" },
    { key: "true", text: "JSON" },
  ];

  const priorityLevelOptionList: IChoiceGroupOption[] = [
    { key: Constants.PriorityLevel.Low, text: "Low" },
    { key: Constants.PriorityLevel.High, text: "High" },
  ];

  const handleOnPriorityLevelOptionChange = (
    ev: React.FormEvent<HTMLInputElement>,
    option: IChoiceGroupOption,
  ): void => {
    setPriorityLevel(option.key);
  };

  const handleOnPageOptionChange = (ev: React.FormEvent<HTMLInputElement>, option: IChoiceGroupOption): void => {
    setPageOption(option.key);
  };

  const handleOnQueryTimeoutToggleChange = (ev: React.MouseEvent<HTMLElement>, checked?: boolean): void => {
    setQueryTimeoutEnabled(checked);
  };

  const handleOnQueryTimeoutSpinButtonChange = (ev: React.MouseEvent<HTMLElement>, newValue?: string): void => {
    const queryTimeout = Number(newValue);
    if (!isNaN(queryTimeout)) {
      setQueryTimeout(queryTimeout);
    }
  };

  const choiceButtonStyles = {
    root: {
      clear: "both",
    },
    flexContainer: [
      {
        selectors: {
          ".ms-ChoiceFieldGroup root-133": {
            clear: "both",
          },
          ".ms-ChoiceField-wrapper label": {
            fontSize: 12,
            paddingTop: 0,
          },
          ".ms-ChoiceField": {
            marginTop: 0,
          },
        },
      },
    ],
  };

  const queryTimeoutToggleStyles: IToggleStyles = {
    label: {
      fontSize: 12,
      fontWeight: 400,
      display: "block",
    },
    root: {},
    container: {},
    pill: {},
    thumb: {},
    text: {},
  };

  const queryTimeoutSpinButtonStyles: ISpinButtonStyles = {
    label: {
      fontSize: 12,
      fontWeight: 400,
    },
    root: {},
    labelWrapper: {},
    icon: {},
    spinButtonWrapper: {},
    input: {},
    arrowButtonsContainer: {},
  };

  return (
    <RightPaneForm {...genericPaneProps}>
      <div className="paneMainContent">
        {shouldShowQueryPageOptions && (
          <div className="settingsSection">
            <div className="settingsSectionPart">
              <fieldset>
                <legend id="pageOptions" className="settingsSectionLabel legendLabel">
                  Page Options
                </legend>
                <InfoTooltip>
                  Choose Custom to specify a fixed amount of query results to show, or choose Unlimited to show as many
                  query results per page.
                </InfoTooltip>
                <ChoiceGroup
                  ariaLabelledBy="pageOptions"
                  selectedKey={pageOption}
                  options={pageOptionList}
                  styles={choiceButtonStyles}
                  onChange={handleOnPageOptionChange}
                />
              </fieldset>
            </div>
            <div className="tabs settingsSectionPart">
              {isCustomPageOptionSelected() && (
                <div className="tabcontent">
                  <div className="settingsSectionLabel">
                    Query results per page
                    <InfoTooltip>Enter the number of query results that should be shown per page.</InfoTooltip>
                  </div>

                  <SpinButton
                    ariaLabel="Custom query items per page"
                    value={"" + customItemPerPage}
                    onIncrement={(newValue) => {
                      setCustomItemPerPage(parseInt(newValue) + 1 || customItemPerPage);
                    }}
                    onDecrement={(newValue) => setCustomItemPerPage(parseInt(newValue) - 1 || customItemPerPage)}
                    onValidate={(newValue) => setCustomItemPerPage(parseInt(newValue) || customItemPerPage)}
                    min={1}
                    step={1}
                    className="textfontclr"
                    incrementButtonAriaLabel="Increase value by 1"
                    decrementButtonAriaLabel="Decrease value by 1"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {userContext.apiType === "SQL" && (
          <div className="settingsSection">
            <div className="settingsSectionPart">
              <div>
                <legend id="queryTimeoutLabel" className="settingsSectionLabel legendLabel">
                  Query Timeout
                </legend>
                <InfoTooltip>
                  When a query reaches a specified time limit, a popup with an option to cancel the query will show
                </InfoTooltip>
              </div>
              <div>
                <Toggle
                  styles={queryTimeoutToggleStyles}
                  label="Enable query timeout"
                  onChange={handleOnQueryTimeoutToggleChange}
                  defaultChecked={queryTimeoutEnabled}
                />
              </div>
              {queryTimeoutEnabled && (
                <div>
                  <SpinButton
                    label="Query timeout (ms)"
                    labelPosition={Position.top}
                    defaultValue={(queryTimeout || 5000).toString()}
                    min={0}
                    step={1000}
                    onChange={handleOnQueryTimeoutSpinButtonChange}
                    incrementButtonAriaLabel="Increase value by 1000"
                    decrementButtonAriaLabel="Decrease value by 1000"
                    styles={queryTimeoutSpinButtonStyles}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        <div className="settingsSection">
          <div className="settingsSectionPart">
            <div className="settingsSectionLabel">
              Enable container pagination
              <InfoTooltip>
                Load 50 containers at a time. Currently, containers are not pulled in alphanumeric order.
              </InfoTooltip>
            </div>
            <Checkbox
              styles={{
                label: { padding: 0 },
              }}
              className="padding"
              ariaLabel="Enable container pagination"
              checked={containerPaginationEnabled}
              onChange={() => setContainerPaginationEnabled(!containerPaginationEnabled)}
            />
          </div>
        </div>
        {shouldShowCrossPartitionOption && (
          <div className="settingsSection">
            <div className="settingsSectionPart">
              <div className="settingsSectionLabel">
                Enable cross-partition query
                <InfoTooltip>
                  Send more than one request while executing a query. More than one request is necessary if the query is
                  not scoped to single partition key value.
                </InfoTooltip>
              </div>

              <Checkbox
                styles={{
                  label: { padding: 0 },
                }}
                className="padding"
                ariaLabel="Enable cross partition query"
                checked={crossPartitionQueryEnabled}
                onChange={() => setCrossPartitionQueryEnabled(!crossPartitionQueryEnabled)}
              />
            </div>
          </div>
        )}
        {shouldShowParallelismOption && (
          <div className="settingsSection">
            <div className="settingsSectionPart">
              <div className="settingsSectionLabel">
                Max degree of parallelism
                <InfoTooltip>
                  Gets or sets the number of concurrent operations run client side during parallel query execution. A
                  positive property value limits the number of concurrent operations to the set value. If it is set to
                  less than 0, the system automatically decides the number of concurrent operations to run.
                </InfoTooltip>
              </div>

              <SpinButton
                min={-1}
                step={1}
                className="textfontclr"
                role="textbox"
                id="max-degree"
                value={"" + maxDegreeOfParallelism}
                onIncrement={(newValue) => setMaxDegreeOfParallelism(parseInt(newValue) + 1 || maxDegreeOfParallelism)}
                onDecrement={(newValue) => setMaxDegreeOfParallelism(parseInt(newValue) - 1 || maxDegreeOfParallelism)}
                onValidate={(newValue) => setMaxDegreeOfParallelism(parseInt(newValue) || maxDegreeOfParallelism)}
                ariaLabel="Max degree of parallelism"
              />
            </div>
          </div>
        )}
        {shouldShowPriorityLevelOption && (
          <div className="settingsSection">
            <div className="settingsSectionPart">
              <fieldset>
                <legend id="priorityLevel" className="settingsSectionLabel legendLabel">
                  Priority Level
                </legend>
                <InfoTooltip>
                  Sets the priority level for data-plane requests from Data Explorer when using Priority-Based
                  Execution. If &quot;None&quot; is selected, Data Explorer will not specify priority level, and the
                  server-side default priority level will be used.
                </InfoTooltip>
                <ChoiceGroup
                  ariaLabelledBy="priorityLevel"
                  selectedKey={priorityLevel}
                  options={priorityLevelOptionList}
                  styles={choiceButtonStyles}
                  onChange={handleOnPriorityLevelOptionChange}
                />
              </fieldset>
            </div>
          </div>
        )}
        {shouldShowGraphAutoVizOption && (
          <div className="settingsSection">
            <div className="settingsSectionPart">
              <div className="settingsSectionLabel">
                Display Gremlin query results as:&nbsp;
                <InfoTooltip>
                  Select Graph to automatically visualize the query results as a Graph or JSON to display the results as
                  JSON.
                </InfoTooltip>
              </div>

              <ChoiceGroup
                selectedKey={graphAutoVizDisabled}
                options={graphAutoOptionList}
                onChange={handleOnGremlinChange}
                aria-label="Graph Auto-visualization"
              />
            </div>
          </div>
        )}
        <div className="settingsSection">
          <div className="settingsSectionPart">
            <div className="settingsSectionLabel">Explorer Version</div>
            <div>{explorerVersion}</div>
          </div>
        </div>
      </div>
    </RightPaneForm>
  );
};
