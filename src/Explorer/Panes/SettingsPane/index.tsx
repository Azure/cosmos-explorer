import { Checkbox, Pivot, PivotItem, PivotLinkFormat, PivotLinkSize, SpinButton } from "office-ui-fabric-react";
import React, { FunctionComponent, MouseEvent, useEffect, useState } from "react";
import * as Constants from "../../../Common/Constants";
import { configContext } from "../../../ConfigContext";
import { LocalStorageUtility, StorageKey } from "../../../Shared/StorageUtility";
import * as StringUtility from "../../../Shared/StringUtility";
import { userContext } from "../../../UserContext";
import { logConsoleInfo } from "../../../Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";
import { GenericRightPaneComponent, GenericRightPaneProps } from "../GenericRightPaneComponent";
import { Tooltip } from "./Tooltip";

export interface SettingsPaneProps {
  explorer: Explorer;
  closePanel: () => void;
}

export const SettingsPane: FunctionComponent<SettingsPaneProps> = ({
  explorer: container,
  closePanel,
}: SettingsPaneProps) => {
  const [formErrors, setFormErrors] = useState<string>("");
  const [formErrorsDetails, setFormErrorsDetails] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [pageOption, setPageOption] = useState<string>("");
  const [customItemPerPage, setCustomItemPerPage] = useState<number>(0);
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

  useEffect(() => {
    _loadSettings();
  }, []);

  const handlerOnSubmit = (e: MouseEvent<HTMLButtonElement>) => {
    setFormErrors("");
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

  const _loadSettings = () => {
    setIsExecuting(true);
    try {
      setPageOption(
        LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage) === Constants.Queries.unlimitedItemsPerPage
          ? Constants.Queries.UnlimitedPageOption
          : Constants.Queries.CustomPageOption
      );
      setPageOption(
        LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage) === Constants.Queries.unlimitedItemsPerPage
          ? Constants.Queries.UnlimitedPageOption
          : Constants.Queries.CustomPageOption
      );
      setCustomItemPerPage(LocalStorageUtility.getEntryNumber(StorageKey.CustomItemPerPage));
    } catch (exception) {
      setFormErrors("Unable to load your settings");
      setFormErrorsDetails(exception);
    } finally {
      setIsExecuting(false);
    }
  };

  const onPivotChange = (item: PivotItem): void => {
    setPageOption(item.props.itemKey);
  };
  const onGremlinPivotChange = (item: PivotItem): void => {
    setGraphAutoVizDisabled(item.props.itemKey);
  };
  const genericPaneProps: GenericRightPaneProps = {
    container,
    formError: formErrors,
    formErrorDetail: formErrorsDetails,
    id: "settingspane",
    isExecuting,
    title: "Setting",
    submitButtonText: "Apply",
    onClose: () => closePanel(),
    onSubmit: () => handlerOnSubmit(undefined),
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="paneMainContent">
        <div>
          {shouldShowQueryPageOptions && (
            <div className="settingsSection">
              <div className="settingsSectionPart pageOptionsPart">
                <div className="settingsSectionLabel">
                  Page options
                  <Tooltip>
                    Choose Custom to specify a fixed amount of query results to show, or choose Unlimited to show as
                    many query results per page.
                  </Tooltip>
                </div>

                <Pivot
                  aria-label="Page options"
                  linkSize={PivotLinkSize.normal}
                  linkFormat={PivotLinkFormat.tabs}
                  onLinkClick={onPivotChange}
                  selectedKey={pageOption}
                >
                  <PivotItem headerText="Custom" itemKey={Constants.Queries.CustomPageOption}></PivotItem>
                  <PivotItem headerText="Unlimited" itemKey={Constants.Queries.UnlimitedPageOption}></PivotItem>
                </Pivot>
              </div>
              <div className="tabs settingsSectionPart">
                {isCustomPageOptionSelected() && (
                  <div className="tabcontent">
                    <div className="settingsSectionLabel">
                      Query results per page
                      <Tooltip>Enter the number of query results that should be shown per page.</Tooltip>
                    </div>

                    <SpinButton
                      ariaLabel="Custom query items per page"
                      value={"" + customItemPerPage}
                      onIncrement={(newValue) => {
                        setCustomItemPerPage(parseInt(newValue) + 1 || customItemPerPage);
                      }}
                      onDecrement={(newValue) => setCustomItemPerPage(parseInt(newValue) - 1 || customItemPerPage)}
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
                  <Tooltip>
                    Send more than one request while executing a query. More than one request is necessary if the query
                    is not scoped to single partition key value.
                  </Tooltip>
                </div>

                <Checkbox
                  style={{ padding: "0" }}
                  className="padding"
                  tabIndex={0}
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
                  <Tooltip>
                    Gets or sets the number of concurrent operations run client side during parallel query execution. A
                    positive property value limits the number of concurrent operations to the set value. If it is set to
                    less than 0, the system automatically decides the number of concurrent operations to run.
                  </Tooltip>
                </div>

                <SpinButton
                  min={-1}
                  step={1}
                  className="textfontclr"
                  role="textbox"
                  tabIndex={0}
                  id="max-degree"
                  value={"" + maxDegreeOfParallelism}
                  onIncrement={(newValue) =>
                    setMaxDegreeOfParallelism(parseInt(newValue) + 1 || maxDegreeOfParallelism)
                  }
                  onDecrement={(newValue) =>
                    setMaxDegreeOfParallelism(parseInt(newValue) - 1 || maxDegreeOfParallelism)
                  }
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
                  <Tooltip>
                    Select Graph to automatically visualize the query results as a Graph or JSON to display the results
                    as JSON.
                  </Tooltip>
                </div>

                <Pivot
                  aria-label="Graph Auto-visualization"
                  linkSize={PivotLinkSize.normal}
                  linkFormat={PivotLinkFormat.tabs}
                  onLinkClick={onGremlinPivotChange}
                  selectedKey={graphAutoVizDisabled}
                >
                  <PivotItem headerText="Graph" itemKey="false"></PivotItem>
                  <PivotItem headerText="JSON" itemKey="true"></PivotItem>
                </Pivot>
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
      </div>
    </GenericRightPaneComponent>
  );
};
