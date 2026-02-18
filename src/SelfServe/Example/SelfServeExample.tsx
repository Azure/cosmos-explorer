import { SelfServeType } from "SelfServe/SelfServeUtils";
import { IsDisplayable, OnChange, PropertyInfo, RefreshOptions, Values } from "../Decorators";
import { selfServeTraceStart, selfServeTraceSuccess } from "../SelfServeTelemetryProcessor";
import {
  Description,
  DescriptionType,
  Info,
  InputType,
  NumberUiType,
  OnSaveResult,
  RefreshResult,
  SelfServeBaseClass,
  SmartUiInput,
} from "../SelfServeTypes";

import type { ChoiceItem } from "../SelfServeTypes";

import {
  getMaxCollectionThroughput,
  getMaxDatabaseThroughput,
  getMinCollectionThroughput,
  getMinDatabaseThroughput,
  initialize,
  onRefreshSelfServeExample,
  update,
} from "./SelfServeExample.rp";
import { AccountProps, Regions } from "./SelfServeExample.types";

const regionDropdownItems: ChoiceItem[] = [
  { labelTKey: "NorthCentralUS", key: Regions.NorthCentralUS },
  { labelTKey: "WestUS", key: Regions.WestUS },
  { labelTKey: "EastUS2", key: Regions.EastUS2 },
];

const regionDropdownInfo: Info = {
  messageTKey: "RegionDropdownInfo",
};

const onRegionsChange = (newValue: InputType, currentState: Map<string, SmartUiInput>): Map<string, SmartUiInput> => {
  currentState.set("regions", { value: newValue });

  const currentRegionText = `current region selected is ${newValue}`;
  currentState.set("currentRegionText", {
    value: { textTKey: currentRegionText, type: DescriptionType.Text } as Description,
    hidden: false,
  });

  const currentEnableLogging = currentState.get("enableLogging");
  if (newValue === Regions.NorthCentralUS) {
    currentState.set("enableLogging", { value: false, disabled: true });
  } else {
    currentState.set("enableLogging", { value: currentEnableLogging.value, disabled: false });
  }
  return currentState;
};

const onEnableDbLevelThroughputChange = (
  newValue: InputType,
  currentState: Map<string, SmartUiInput>,
): Map<string, SmartUiInput> => {
  currentState.set("enableDbLevelThroughput", { value: newValue });
  const currentDbThroughput = currentState.get("dbThroughput");
  const isDbThroughputHidden = newValue === undefined || !(newValue as boolean);
  currentState.set("dbThroughput", { value: currentDbThroughput.value, hidden: isDbThroughputHidden });
  return currentState;
};

const validate = (
  currentvalues: Map<string, SmartUiInput>,
  baselineValues: ReadonlyMap<string, SmartUiInput>,
): void => {
  if (currentvalues.get("dbThroughput") === baselineValues.get("dbThroughput")) {
    throw new Error("DbThroughputValidationError");
  }
  if (!currentvalues.get("regions").value || !currentvalues.get("accountName").value) {
    throw new Error("RegionsAndAccountNameValidationError");
  }
};

@IsDisplayable()
@RefreshOptions({ retryIntervalInMs: 2000 })
export default class SelfServeExample extends SelfServeBaseClass {
  public onRefresh = async (): Promise<RefreshResult> => {
    return onRefreshSelfServeExample();
  };

  /*
    In this example, the onSave callback simply sets the value for keys corresponding to the field name in the  SessionStorage.
    It uses the currentValues and baselineValues maps to perform custom validations as well.
  */
  public onSave = async (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>,
  ): Promise<OnSaveResult> => {
    validate(currentValues, baselineValues);
    const regions = Regions[currentValues.get("regions")?.value as keyof typeof Regions];
    const enableLogging = currentValues.get("enableLogging")?.value as boolean;
    const accountName = currentValues.get("accountName")?.value as string;
    const collectionThroughput = currentValues.get("collectionThroughput")?.value as number;
    const enableDbLevelThroughput = currentValues.get("enableDbLevelThroughput")?.value as boolean;
    let dbThroughput = currentValues.get("dbThroughput")?.value as number;
    dbThroughput = enableDbLevelThroughput ? dbThroughput : undefined;
    try {
      const accountProps: AccountProps = { regions, enableLogging, accountName, collectionThroughput, dbThroughput };
      const telemetryData = { ...accountProps, selfServeClassName: SelfServeExample.name };

      const onSaveTimeStamp = selfServeTraceStart(telemetryData);
      await update(accountProps);
      selfServeTraceSuccess(telemetryData, onSaveTimeStamp);

      if (currentValues.get("regions") === baselineValues.get("regions")) {
        return {
          operationStatusUrl: undefined,
          portalNotification: {
            initialize: {
              titleTKey: "SubmissionMessageSuccessTitle",
              messageTKey: "SubmissionMessageForSameRegionText",
            },
            success: {
              titleTKey: "UpdateCompletedMessageTitle",
              messageTKey: "UpdateCompletedMessageText",
            },
            failure: {
              titleTKey: "SubmissionMessageErrorTitle",
              messageTKey: "SubmissionMessageErrorText",
            },
          },
        };
      } else {
        return {
          operationStatusUrl: undefined,
          portalNotification: {
            initialize: {
              titleTKey: "SubmissionMessageSuccessTitle",
              messageTKey: "SubmissionMessageForNewRegionText",
            },
            success: {
              titleTKey: "UpdateCompletedMessageTitle",
              messageTKey: "UpdateCompletedMessageText",
            },
            failure: {
              titleTKey: "SubmissionMessageErrorTitle",
              messageTKey: "SubmissionMessageErrorText",
            },
          },
        };
      }
    } catch (error) {
      throw new Error("OnSaveFailureMessage");
    }
  };

  /*
    In this example, the initialize function simply reads the SessionStorage to fetch the default values
    for these fields. These are then set when the changes are submitted.
  */
  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
    const initializeResponse = await initialize();
    const defaults = new Map<string, SmartUiInput>();
    defaults.set("currentRegionText", undefined);
    defaults.set("regions", { value: initializeResponse.regions });
    defaults.set("enableLogging", { value: initializeResponse.enableLogging });
    const accountName = initializeResponse.accountName;
    defaults.set("accountName", { value: accountName ? accountName : "" });
    defaults.set("collectionThroughput", { value: initializeResponse.collectionThroughput });
    const enableDbLevelThroughput = !!initializeResponse.dbThroughput;
    defaults.set("enableDbLevelThroughput", { value: enableDbLevelThroughput });
    defaults.set("dbThroughput", { value: initializeResponse.dbThroughput, hidden: !enableDbLevelThroughput });
    return defaults;
  };

  public getSelfServeType = (): SelfServeType => {
    return SelfServeType.example;
  };

  @Values({
    labelTKey: "DescriptionLabel",
    description: {
      textTKey: "DescriptionText",
      type: DescriptionType.Text,
      link: {
        href: "https://aka.ms/cosmos-create-account-portal",
        textTKey: "DecriptionLinkText",
      },
    },
  })
  description: string;

  @Values({
    description: {
      textTKey: `This UI can be used to dynamically change the throughput.
This is an alternative to updating the throughput from the 'scale & settings' tab.`,
      type: DescriptionType.Text,
    },
  })
  multiLineDescription: string;

  @Values({
    labelTKey: "Current Region",
    isDynamicDescription: true,
  })
  currentRegionText: string;

  @PropertyInfo(regionDropdownInfo)

  /*
    In this example, the onRegionsChange function sets the enableLogging property to false (and disables
    the corresponsing toggle UI) when "regions" is set to "North Central US", and enables the toggle for
    any other value of "regions"
  */
  @OnChange(onRegionsChange)
  @Values({ labelTKey: "Regions", choices: regionDropdownItems, placeholderTKey: "RegionsPlaceholder" })
  regions: ChoiceItem;

  @Values({
    labelTKey: "Enable Logging",
    trueLabelTKey: "Enable",
    falseLabelTKey: "Disable",
  })
  enableLogging: boolean;

  @Values({
    labelTKey: "Account Name",
    placeholderTKey: "AccountNamePlaceHolder",
  })
  accountName: string;

  @Values({
    labelTKey: "Collection Throughput",
    min: getMinCollectionThroughput,
    max: getMaxCollectionThroughput,
    step: 100,
    uiType: NumberUiType.Spinner,
  })
  collectionThroughput: number;

  /*
    In this example, the onEnableDbLevelThroughputChange function makes the dbThroughput property visible when
    enableDbLevelThroughput, a boolean, is set to true and hides dbThroughput property when it is set to false.
  */
  @OnChange(onEnableDbLevelThroughputChange)
  @Values({
    labelTKey: "Enable DB level throughput",
    trueLabelTKey: "Enable",
    falseLabelTKey: "Disable",
  })
  enableDbLevelThroughput: boolean;

  @Values({
    labelTKey: "Database Throughput",
    min: getMinDatabaseThroughput,
    max: getMaxDatabaseThroughput,
    step: 100,
    uiType: NumberUiType.Slider,
  })
  dbThroughput: number;
}
