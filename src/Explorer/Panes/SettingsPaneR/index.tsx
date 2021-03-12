import { PrimaryButton } from "office-ui-fabric-react";
import React, { FunctionComponent, KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as Constants from "../../../Common/Constants";
import { configContext } from "../../../ConfigContext";
import { LocalStorageUtility, StorageKey } from "../../../Shared/StorageUtility";
import * as StringUtility from "../../../Shared/StringUtility";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import Explorer from "../../Explorer";

export interface SettingsPaneProps {
  explorer: Explorer;
  closePanel: () => void;
}

export const SettingsPaneR: FunctionComponent<SettingsPaneProps> = ({ explorer, closePanel }: SettingsPaneProps) => {
  const [formErrors, setFormErrors] = useState("");
  const [formErrorsDetails, setFormErrorsDetails] = useState();
  const [isExecuting, setIsExecuting] = useState(false);
  const [pageOption, setPageOption] = useState("");
  const [customItemPerPage, setCustomItemPerPage] = useState(0);
  const [crossPartitionQueryEnabled, setCrossPartitionQueryEnabled] = useState(
    LocalStorageUtility.hasItem(StorageKey.IsCrossPartitionQueryEnabled)
      ? LocalStorageUtility.getEntryString(StorageKey.IsCrossPartitionQueryEnabled) === "true"
      : true
  );
  const [graphAutoVizDisabled, setGraphAutoVizDisabled] = useState(
    LocalStorageUtility.hasItem(StorageKey.IsGraphAutoVizDisabled)
      ? LocalStorageUtility.getEntryString(StorageKey.IsGraphAutoVizDisabled)
      : "false"
  );
  const [maxDegreeOfParallelism, setMaxDegreeOfParallelism] = useState(
    LocalStorageUtility.hasItem(StorageKey.MaxDegreeOfParellism)
      ? LocalStorageUtility.getEntryNumber(StorageKey.MaxDegreeOfParellism)
      : Constants.Queries.DefaultMaxDegreeOfParallelism
  );
  const explorerVersion = configContext.gitSha;
  const shouldShowQueryPageOptions = explorer?.isPreferredApiDocumentDB();
  const shouldShowGraphAutoVizOption = explorer?.isPreferredApiGraph();

  const shouldShowCrossPartitionOption = !explorer?.isPreferredApiGraph();
  const shouldShowParallelismOption = !explorer?.isPreferredApiGraph();

  const pageOptionsRef = useRef<HTMLLabelElement>();
  const displayQueryRef = useRef<HTMLLabelElement>();
  const maxDegreeRef = useRef<HTMLInputElement>();

  useEffect(() => {
    _loadSettings();
  }, []);

  useLayoutEffect(() => {
    if (explorer?.isPreferredApiGraph()) {
      displayQueryRef?.current?.focus();
    } else if (explorer?.isPreferredApiTable()) {
      maxDegreeRef?.current?.focus();
    }
    pageOptionsRef?.current?.focus();
  }, []);

  const submit = () => {
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
    NotificationConsoleUtils.logConsoleInfo(
      `Updated items per page setting to ${LocalStorageUtility.getEntryNumber(StorageKey.ActualItemPerPage)}`
    );
    NotificationConsoleUtils.logConsoleInfo(
      `${crossPartitionQueryEnabled ? "Enabled" : "Disabled"} cross-partition query feed option`
    );
    NotificationConsoleUtils.logConsoleInfo(
      `Updated the max degree of parallelism query feed option to ${LocalStorageUtility.getEntryNumber(
        StorageKey.MaxDegreeOfParellism
      )}`
    );

    if (shouldShowGraphAutoVizOption) {
      NotificationConsoleUtils.logConsoleInfo(
        `Graph result will be displayed as ${
          LocalStorageUtility.getEntryBoolean(StorageKey.IsGraphAutoVizDisabled) ? "JSON" : "Graph"
        }`
      );
    }

    NotificationConsoleUtils.logConsoleInfo(
      `Updated query setting to ${LocalStorageUtility.getEntryString(StorageKey.SetPartitionKeyUndefined)}`
    );

    close();
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
    <div data-bind="visible: visible, event: { keydown: onPaneKeyDown }">
      <div className="contextual-pane-out" data-bind="click: cancel, clickBubble: false" />
      <div className="contextual-pane" id="settingspane">
        {/* Settings Confirmation form - Start */}
        <div className="contextual-pane-in">
          <form className="paneContentContainer" onSubmit={submit}>
            {/* Settings Confirmation header - Start */}
            <div className="firstdivbg headerline">
              <span role="heading" aria-level={2}>
                Settings
              </span>
              <div className="closeImg" role="button" aria-label="Close pane" tabIndex={0} onClick={closePanel}>
                <img src="../../../images/close-black.svg" title="Close" alt="Close" />
              </div>
            </div>
            {/* Settings Confirmation header - End */}
            {/* Settings Confirmation errors - Start */}
            {formErrors !== "" && (
              <div className="warningErrorContainer" aria-live="assertive">
                <div className="warningErrorContent">
                  <span>
                    <img className="paneErrorIcon" src="../../images/error_red.svg" alt="Error" />
                  </span>
                  <span className="warningErrorDetailsLinkContainer">
                    <span className="formErrors" data-bind="attr: { title: formErrors }">
                      {formErrors}
                    </span>
                    {formErrorsDetails === "" && (
                      <a className="errorLink" role="link" data-bind="click: showErrorDetails">
                        More details
                      </a>
                    )}
                  </span>
                </div>
              </div>
            )}
            {/* Settings Confirmation errors - End */}
            {/* Settings Confirmation inputs - Start */}
            <div className="paneMainContent">
              <div>
                {shouldShowQueryPageOptions && (
                  <div className="settingsSection">
                    <div className="settingsSectionPart pageOptionsPart">
                      <div className="settingsSectionLabel">
                        Page options
                        <span className="infoTooltip" role="tooltip" tabIndex={0}>
                          <img className="infoImg" src="./../../images/info-bubble.svg" alt="More information" />
                          <span className="tooltiptext pageOptionTooltipWidth">
                            Choose Custom to specify a fixed amount of query results to show, or choose Unlimited to
                            show as many query results per page.
                          </span>
                        </span>
                      </div>
                      <div className="tabs" role="radiogroup" aria-label="Page options">
                        {/* Fixed option button - Start */}
                        <div className="tab">
                          <input
                            type="radio"
                            id="customItemPerPage"
                            name="pageOption"
                            defaultValue="custom"
                            checked={isCustomPageOptionSelected()}
                          />
                          <label
                            htmlFor="customItemPerPage"
                            id="custom-selection"
                            tabIndex={0}
                            ref={pageOptionsRef}
                            role="radio"
                            aria-checked={isCustomPageOptionSelected()}
                            onKeyPress={onCustomPageOptionsKeyDown}
                            onClick={() => setPageOption(Constants.Queries.CustomPageOption)}
                          >
                            Custom
                          </label>
                        </div>
                        {/* Fixed option button - End */}
                        {/* Unlimited option button - Start */}
                        <div className="tab">
                          <input
                            type="radio"
                            id="unlimitedItemPerPage"
                            name="pageOption"
                            defaultValue="unlimited"
                            checked={isUnlimitedPageOptionSelected()}
                          />
                          <label
                            htmlFor="unlimitedItemPerPage"
                            id="unlimited-selection"
                            tabIndex={0}
                            role="radio"
                            aria-checked={isUnlimitedPageOptionSelected()}
                            onKeyPress={onUnlimitedPageOptionKeyDown}
                            onClick={() => setPageOption(Constants.Queries.UnlimitedPageOption)}
                          >
                            Unlimited
                          </label>
                        </div>
                        {/* Unlimited option button - End */}
                      </div>
                    </div>
                    <div className="tabs settingsSectionPart">
                      {isCustomPageOptionSelected() && (
                        <div className="tabcontent">
                          <div className="settingsSectionLabel">
                            Query results per page
                            <span className="infoTooltip" role="tooltip" tabIndex={0}>
                              <img className="infoImg" src="./../../images/info-bubble.svg" alt="More information" />
                              <span className="tooltiptext pageOptionTooltipWidth">
                                Enter the number of query results that should be shown per page.
                              </span>
                            </span>
                          </div>
                          <input
                            type="number"
                            required
                            value={customItemPerPage}
                            onChange={(e) => setCustomItemPerPage(parseInt(e.target.value))}
                            min={1}
                            step={1}
                            className="textfontclr collid"
                            aria-label="Custom query items per page"
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
                        <span className="infoTooltip" role="tooltip" tabIndex={0}>
                          <img className="infoImg" src="./../../images/info-bubble.svg" alt="More information" />
                          <span className="tooltiptext pageOptionTooltipWidth">
                            Send more than one request while executing a query. More than one request is necessary if
                            the query is not scoped to single partition key value.
                          </span>
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        tabIndex={0}
                        aria-label="Enable cross partition query"
                        defaultChecked={crossPartitionQueryEnabled}
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
                        <span className="infoTooltip" role="tooltip" tabIndex={0}>
                          <img className="infoImg" src="./../../images/info-bubble.svg" alt="More information" />
                          <span className="tooltiptext pageOptionTooltipWidth">
                            Gets or sets the number of concurrent operations run client side during parallel query
                            execution. A positive property value limits the number of concurrent operations to the set
                            value. If it is set to less than 0, the system automatically decides the number of
                            concurrent operations to run.
                          </span>
                        </span>
                      </div>

                      <input
                        type="number"
                        required
                        min={-1}
                        step={1}
                        className="textfontclr collid"
                        role="textbox"
                        tabIndex={0}
                        id="max-degree"
                        ref={maxDegreeRef}
                        value={maxDegreeOfParallelism}
                        onChange={(e) => setMaxDegreeOfParallelism(parseInt(e.target.value))}
                        aria-label="Max degree of parallelism"
                        autoFocus
                      />
                    </div>
                  </div>
                )}
                {shouldShowGraphAutoVizOption && (
                  <div className="settingsSection">
                    <div className="settingsSectionPart">
                      <div className="settingsSectionLabel">
                        Display Gremlin query results as:&nbsp;
                        <span className="infoTooltip" role="tooltip" tabIndex={0}>
                          <img className="infoImg" src="./../../images/info-bubble.svg" alt="More information" />
                          <span className="tooltiptext pageOptionTooltipWidth">
                            Select Graph to automatically visualize the query results as a Graph or JSON to display the
                            results as JSON.
                          </span>
                        </span>
                      </div>
                      <div className="tabs" role="radiogroup" aria-label="Graph Auto-visualization">
                        {/* Fixed option button - Start */}
                        <div className="tab">
                          <input
                            type="radio"
                            id="graphAutoVizOn"
                            name="graphAutoVizOption"
                            defaultValue="false"
                            checked={Boolean(graphAutoVizDisabled)}
                          />
                          <label
                            htmlFor="graphAutoVizOn"
                            id="graph-display"
                            tabIndex={0}
                            ref={displayQueryRef}
                            role="radio"
                            aria-checked={graphAutoVizDisabled === "false" ? "true" : "false"}
                            onKeyPress={onGraphDisplayResultsKeyDown}
                          >
                            Graph
                          </label>
                        </div>
                        {/* Fixed option button - End */}
                        {/* Unlimited option button - Start */}
                        <div className="tab">
                          <input
                            type="radio"
                            id="graphAutoVizOff"
                            name="graphAutoVizOption"
                            defaultValue="true"
                            checked={Boolean(graphAutoVizDisabled)}
                          />
                          <label
                            htmlFor="graphAutoVizOff"
                            tabIndex={0}
                            role="radio"
                            aria-checked={graphAutoVizDisabled === "true" ? "true" : "false"}
                            onKeyPress={onJsonDisplayResultsKeyDown}
                          >
                            JSON
                          </label>
                        </div>
                        {/* Unlimited option button - End */}
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
                <PrimaryButton type="submit">Apply</PrimaryButton>
              </div>
            </div>
            {/* Settings Confirmation inputs - End */}
          </form>
        </div>
        {/* Settings Confirmation form  - Start */}
        {/* Loader - Start */}
        {isExecuting && (
          <div className="dataExplorerLoaderContainer dataExplorerPaneLoaderContainer">
            <img className="dataExplorerLoader" src="/LoadingIndicator_3Squares.gif" />
          </div>
        )}
        {/* Loader - End */}
      </div>
    </div>
  );
};
