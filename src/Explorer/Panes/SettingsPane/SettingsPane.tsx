import { Checkbox, ChoiceGroup, IChoiceGroupOption, SpinButton } from "@fluentui/react";
import React, { FunctionComponent, MouseEvent, useState } from "react";
import * as Constants from "../../../Common/Constants";
import { InfoTooltip } from "../../../Common/Tooltip/InfoTooltip";
import { configContext } from "../../../ConfigContext";
import { LocalStorageUtility, StorageKey } from "../../../Shared/StorageUtility";
import * as StringUtility from "../../../Shared/StringUtility";
import { userContext } from "../../../UserContext";
import { logConsoleInfo } from "../../../Utils/NotificationConsoleUtils";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export interface SettingsPaneProps {
  expandConsole: () => void;
  closePanel: () => void;
}

export const SettingsPane: FunctionComponent<SettingsPaneProps> = ({
  expandConsole,
  closePanel,
}: SettingsPaneProps) => {
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [pageOption, setPageOption] = useState<string>(
    LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage) === Constants.Queries.unlimitedItemsPerPage
      ? Constants.Queries.UnlimitedPageOption
      : Constants.Queries.CustomPageOption
  );
  const [customItemPerPage, setCustomItemPerPage] = useState<number>(
    LocalStorageUtility.getEntryNumber(StorageKey.CustomItemPerPage) || 0
  );
  const [crossPartitionQueryEnabled, setCrossPartitionQueryEnabled] = useState<boolean>(
    LocalStorageUtility.hasItem(StorageKey.IsCrossPartitionQueryEnabled)
      ? LocalStorageUtility.getEntryString(StorageKey.IsCrossPartitionQueryEnabled) === "true"
      : true
  );
  const [graphAutoVizDisabled, setGraphAutoVizDisabled] = useState<string>(
    LocalStorageUtility.hasItem(StorageKey.IsGraphAutoVizDisabled)
      ? LocalStorageUtility.getEntryString(StorageKey.IsGraphAutoVizDisabled)
      : "false"
  );
  const [maxDegreeOfParallelism, setMaxDegreeOfParallelism] = useState<number>(
    LocalStorageUtility.hasItem(StorageKey.MaxDegreeOfParellism)
      ? LocalStorageUtility.getEntryNumber(StorageKey.MaxDegreeOfParellism)
      : Constants.Queries.DefaultMaxDegreeOfParallelism
  );
  const explorerVersion = configContext.gitSha;
  const shouldShowQueryPageOptions = userContext.apiType === "SQL";
  const shouldShowGraphAutoVizOption = userContext.apiType === "Gremlin";
  const shouldShowCrossPartitionOption = userContext.apiType !== "Gremlin";
  const shouldShowParallelismOption = userContext.apiType !== "Gremlin";

  const handlerOnSubmit = (e: MouseEvent<HTMLButtonElement>) => {
    setIsExecuting(true);

    LocalStorageUtility.setEntryNumber(
      StorageKey.ActualItemPerPage,
      isCustomPageOptionSelected() ? customItemPerPage : Constants.Queries.unlimitedItemsPerPage
    );
    LocalStorageUtility.setEntryNumber(StorageKey.CustomItemPerPage, customItemPerPage);
    LocalStorageUtility.setEntryString(StorageKey.IsCrossPartitionQueryEnabled, crossPartitionQueryEnabled.toString());
    LocalStorageUtility.setEntryNumber(StorageKey.MaxDegreeOfParellism, maxDegreeOfParallelism);

    if (shouldShowGraphAutoVizOption) {
      LocalStorageUtility.setEntryBoolean(
        StorageKey.IsGraphAutoVizDisabled,
        StringUtility.toBoolean(graphAutoVizDisabled)
      );
    }

    setIsExecuting(false);
    logConsoleInfo(
      `Updated items per page setting to ${LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage)}`
    );
    logConsoleInfo(`${crossPartitionQueryEnabled ? "Enabled" : "Disabled"} cross-partition query feed option`);
    logConsoleInfo(
      `Updated the max degree of parallelism query feed option to ${LocalStorageUtility.getEntryNumber(
        StorageKey.MaxDegreeOfParellism
      )}`
    );

    if (shouldShowGraphAutoVizOption) {
      logConsoleInfo(
        `Graph result will be displayed as ${
          LocalStorageUtility.getEntryBoolean(StorageKey.IsGraphAutoVizDisabled) ? "JSON" : "Graph"
        }`
      );
    }

    logConsoleInfo(
      `Updated query setting to ${LocalStorageUtility.getEntryString(StorageKey.SetPartitionKeyUndefined)}`
    );
    closePanel();
    e.preventDefault();
  };

  const isCustomPageOptionSelected = () => {
    return pageOption === Constants.Queries.CustomPageOption;
  };

  const handleOnGremlinChange = (ev: React.FormEvent<HTMLInputElement>, option: IChoiceGroupOption): void => {
    setGraphAutoVizDisabled(option.key);
  };

  const genericPaneProps: RightPaneFormProps = {
    expandConsole,
    formError: "",
    isExecuting,
    submitButtonText: "Apply",
    onSubmit: () => handlerOnSubmit(undefined),
  };
  const pageOptionList: IChoiceGroupOption[] = [
    { key: Constants.Queries.CustomPageOption, text: "Custom" },
    { key: Constants.Queries.UnlimitedPageOption, text: "Unlimited" },
  ];

  const graphAutoOptionList: IChoiceGroupOption[] = [
    { key: "false", text: "Graph" },
    { key: "true", text: "JSON" },
  ];

  const handleOnPageOptionChange = (ev: React.FormEvent<HTMLInputElement>, option: IChoiceGroupOption): void => {
    setPageOption(option.key);
  };
  return (
    <RightPaneForm {...genericPaneProps}>
      <div className="paneMainContent">
        {shouldShowQueryPageOptions && (
          <div className="settingsSection">
            <div className="settingsSectionPart pageOptionsPart">
              <div className="settingsSectionLabel">
                Page options
                <InfoTooltip>
                  Choose Custom to specify a fixed amount of query results to show, or choose Unlimited to show as many
                  query results per page.
                </InfoTooltip>
              </div>
              <ChoiceGroup selectedKey={pageOption} options={pageOptionList} onChange={handleOnPageOptionChange} />
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
                tabIndex={0}
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
