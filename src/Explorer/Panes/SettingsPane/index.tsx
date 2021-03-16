import { Checkbox, PrimaryButton, SpinButton } from "office-ui-fabric-react";
import React, { FunctionComponent, KeyboardEvent, MouseEvent, useEffect, useState } from "react";
import closeBlack from "../../../../images/close-black.svg";
import errorRed from "../../../../images/error_red.svg";
import * as Constants from "../../../Common/Constants";
import { configContext } from "../../../ConfigContext";
import { LocalStorageUtility, StorageKey } from "../../../Shared/StorageUtility";
import * as StringUtility from "../../../Shared/StringUtility";
import { userContext } from "../../../UserContext";
import { logConsoleInfo } from "../../../Utils/NotificationConsoleUtils";
import { Tooltip } from "./Tooltip";

export interface SettingsPaneProps {
  closePanel: () => void;
  openNotificationConsole: () => void;
}

export const SettingsPane: FunctionComponent<SettingsPaneProps> = ({
  closePanel,
  openNotificationConsole,
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

  const isUnlimitedPageOptionSelected = () => {
    return pageOption === Constants.Queries.UnlimitedPageOption;
  };

  const onUnlimitedPageOptionKeyDown = (event: KeyboardEvent) => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      setPageOption(Constants.Queries.UnlimitedPageOption);
      event.stopPropagation();
    }
  };

  const onCustomPageOptionsKeyDown = (event: KeyboardEvent) => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      setPageOption(Constants.Queries.CustomPageOption);
      event.stopPropagation();
    }
  };

  const onJsonDisplayResultsKeyDown = (event: KeyboardEvent) => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      setGraphAutoVizDisabled("true");
      event.stopPropagation();
    }
  };

  const onGraphDisplayResultsKeyDown = (event: KeyboardEvent) => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      setGraphAutoVizDisabled("false");
      event.stopPropagation();
    }
  };

  const _loadSettings = () => {
    setIsExecuting(true);
    try {
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

  return (
    <div>
      <div className="contextual-pane-out" />
      <div className="contextual-pane" id="settingspane">
        <div className="contextual-pane-in">
          <form className="paneContentContainer">
            <div className="firstdivbg headerline">
              <span role="heading" aria-level={2}>
                Settings
              </span>
              <div className="closeImg" role="button" aria-label="Close pane" tabIndex={0} onClick={closePanel}>
                <img src={closeBlack} title="Close" alt="Close" />
              </div>
            </div>
            {formErrors !== "" && (
              <div className="warningErrorContainer" aria-live="assertive">
                <div className="warningErrorContent">
                  <span>
                    <img className="paneErrorIcon" src={errorRed} alt="Error" />
                  </span>
                  <span className="warningErrorDetailsLinkContainer">
                    <span className="formErrors" title={formErrors}>
                      {formErrors}
                    </span>
                    {formErrorsDetails === "" && (
                      <a className="errorLink" role="link" onClick={openNotificationConsole}>
                        More details
                      </a>
                    )}
                  </span>
                </div>
              </div>
            )}
            <div className="paneMainContent">
              <div>
                {shouldShowQueryPageOptions && (
                  <div className="settingsSection">
                    <div className="settingsSectionPart pageOptionsPart">
                      <div className="settingsSectionLabel">
                        Page options
                        <Tooltip>
                          Choose Custom to specify a fixed amount of query results to show, or choose Unlimited to show
                          as many query results per page.
                        </Tooltip>
                      </div>
                      <div className="tabs" role="radiogroup" aria-label="Page options">
                        <div className="tab">
                          <input
                            type="radio"
                            id="customItemPerPage"
                            name="pageOption"
                            defaultValue="custom"
                            autoFocus
                            checked={isCustomPageOptionSelected()}
                            onChange={() => setPageOption(Constants.Queries.CustomPageOption)}
                          />
                          <label
                            htmlFor="customItemPerPage"
                            id="custom-selection"
                            tabIndex={0}
                            role="radio"
                            aria-checked={isCustomPageOptionSelected()}
                            onKeyPress={onCustomPageOptionsKeyDown}
                          >
                            Custom
                          </label>
                        </div>
                        <div className="tab">
                          <input
                            type="radio"
                            id="unlimitedItemPerPage"
                            name="pageOption"
                            defaultValue="unlimited"
                            checked={isUnlimitedPageOptionSelected()}
                            onChange={() => setPageOption(Constants.Queries.UnlimitedPageOption)}
                          />
                          <label
                            htmlFor="unlimitedItemPerPage"
                            id="unlimited-selection"
                            tabIndex={0}
                            role="radio"
                            aria-checked={isUnlimitedPageOptionSelected()}
                            onKeyPress={onUnlimitedPageOptionKeyDown}
                          >
                            Unlimited
                          </label>
                        </div>
                      </div>
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
                            onIncrement={(newValue) => setCustomItemPerPage(parseInt(newValue) || customItemPerPage)}
                            onDecrement={(newValue) => setCustomItemPerPage(parseInt(newValue) || customItemPerPage)}
                            min={1}
                            step={1}
                            className="textfontclr"
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
                          Send more than one request while executing a query. More than one request is necessary if the
                          query is not scoped to single partition key value.
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
                          Gets or sets the number of concurrent operations run client side during parallel query
                          execution. A positive property value limits the number of concurrent operations to the set
                          value. If it is set to less than 0, the system automatically decides the number of concurrent
                          operations to run.
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
                          setMaxDegreeOfParallelism(parseInt(newValue) || maxDegreeOfParallelism)
                        }
                        onDecrement={(newValue) =>
                          setMaxDegreeOfParallelism(parseInt(newValue) || maxDegreeOfParallelism)
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
                          Select Graph to automatically visualize the query results as a Graph or JSON to display the
                          results as JSON.
                        </Tooltip>
                      </div>
                      <div className="tabs" role="radiogroup" aria-label="Graph Auto-visualization">
                        <div className="tab">
                          <input
                            type="radio"
                            id="graphAutoVizOn"
                            name="graphAutoVizOption"
                            defaultValue="false"
                            checked={Boolean(graphAutoVizDisabled)}
                            autoFocus={userContext.apiType === "Gremlin"}
                            onChange={() =>
                              setGraphAutoVizDisabled(graphAutoVizDisabled === "false" ? "true" : "false")
                            }
                          />
                          <label
                            htmlFor="graphAutoVizOn"
                            id="graph-display"
                            tabIndex={0}
                            role="radio"
                            aria-checked={graphAutoVizDisabled === "false"}
                            onKeyPress={onGraphDisplayResultsKeyDown}
                          >
                            Graph
                          </label>
                        </div>
                        <div className="tab">
                          <input
                            type="radio"
                            id="graphAutoVizOff"
                            name="graphAutoVizOption"
                            defaultValue="true"
                            checked={Boolean(graphAutoVizDisabled)}
                            onChange={() =>
                              setGraphAutoVizDisabled(graphAutoVizDisabled === "false" ? "true" : "false")
                            }
                          />
                          <label
                            htmlFor="graphAutoVizOff"
                            tabIndex={0}
                            role="radio"
                            aria-checked={graphAutoVizDisabled === "true"}
                            onKeyPress={onJsonDisplayResultsKeyDown}
                          >
                            JSON
                          </label>
                        </div>
                      </div>
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
            <div className="paneFooter">
              <div className="leftpanel-okbut">
                <PrimaryButton type="submit" onClick={handlerOnSubmit}>
                  Apply
                </PrimaryButton>
              </div>
            </div>
          </form>
        </div>
        {isExecuting && (
          <div className="dataExplorerLoaderContainer dataExplorerPaneLoaderContainer">
            <img className="dataExplorerLoader" src="/LoadingIndicator_3Squares.gif" />
          </div>
        )}
      </div>
    </div>
  );
};
