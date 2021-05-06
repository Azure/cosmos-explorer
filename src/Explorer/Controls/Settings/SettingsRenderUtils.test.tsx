import { shallow } from "enzyme";
import React from "react";
import { IColumn, Text } from "@fluentui/react";
import {
  getAutoPilotV3SpendElement,
  getEstimatedSpendingElement,
  manualToAutoscaleDisclaimerElement,
  ttlWarning,
  indexingPolicynUnsavedWarningMessage,
  updateThroughputBeyondLimitWarningMessage,
  updateThroughputDelayedApplyWarningMessage,
  getThroughputApplyDelayedMessage,
  getThroughputApplyShortDelayMessage,
  getThroughputApplyLongDelayMessage,
  getToolTipContainer,
  conflictResolutionCustomToolTip,
  changeFeedPolicyToolTip,
  conflictResolutionLwwTooltip,
  mongoIndexingPolicyDisclaimer,
  mongoIndexingPolicyAADError,
  mongoIndexTransformationRefreshingMessage,
  renderMongoIndexTransformationRefreshMessage,
  ManualEstimatedSpendingDisplayProps,
  PriceBreakdown,
  getRuPriceBreakdown,
} from "./SettingsRenderUtils";

class SettingsRenderUtilsTestComponent extends React.Component {
  public override render(): JSX.Element {
    const estimatedSpendingColumns: IColumn[] = [
      { key: "costType", name: "", fieldName: "costType", minWidth: 100, maxWidth: 200, isResizable: true },
      { key: "hourly", name: "Hourly", fieldName: "hourly", minWidth: 100, maxWidth: 200, isResizable: true },
      { key: "daily", name: "Daily", fieldName: "daily", minWidth: 100, maxWidth: 200, isResizable: true },
      { key: "monthly", name: "Monthly", fieldName: "monthly", minWidth: 100, maxWidth: 200, isResizable: true },
    ];
    const estimatedSpendingItems: ManualEstimatedSpendingDisplayProps[] = [
      {
        costType: <Text>Current Cost</Text>,
        hourly: <Text>$ 1.02</Text>,
        daily: <Text>$ 24.48</Text>,
        monthly: <Text>$ 744.6</Text>,
      },
    ];
    const priceBreakdown: PriceBreakdown = {
      hourlyPrice: 1.02,
      dailyPrice: 24.48,
      monthlyPrice: 744.6,
      pricePerRu: 0.00051,
      currency: "RMB",
      currencySign: "¥",
    };

    return (
      <>
        {getAutoPilotV3SpendElement(1000, false)}
        {getAutoPilotV3SpendElement(undefined, false)}
        {getAutoPilotV3SpendElement(1000, true)}
        {getAutoPilotV3SpendElement(undefined, true)}

        {getEstimatedSpendingElement(estimatedSpendingColumns, estimatedSpendingItems, 1000, 2, priceBreakdown, false)}

        {manualToAutoscaleDisclaimerElement}
        {ttlWarning}
        {indexingPolicynUnsavedWarningMessage}
        {updateThroughputBeyondLimitWarningMessage}
        {updateThroughputDelayedApplyWarningMessage}

        {getThroughputApplyDelayedMessage(false, 1000, "RU/s", "sampleDb", "sampleCollection", 2000)}
        {getThroughputApplyShortDelayMessage(false, 1000, "RU/s", "sampleDb", "sampleCollection")}
        {getThroughputApplyLongDelayMessage(false, 1000, "RU/s", "sampleDb", "sampleCollection", 2000)}

        {getToolTipContainer(<span>Sample Text</span>)}
        {conflictResolutionLwwTooltip}
        {conflictResolutionCustomToolTip}
        {changeFeedPolicyToolTip}

        {mongoIndexingPolicyDisclaimer}
        {mongoIndexingPolicyAADError}
        {mongoIndexTransformationRefreshingMessage}
        {renderMongoIndexTransformationRefreshMessage(0, () => {
          return;
        })}
        {renderMongoIndexTransformationRefreshMessage(90, () => {
          return;
        })}
      </>
    );
  }
}

describe("SettingsUtils functions", () => {
  it("render", () => {
    const wrapper = shallow(<SettingsRenderUtilsTestComponent />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should return correct price breakdown for a manual RU setting of 500, 1 region, multimaster disabled", () => {
    const prices = getRuPriceBreakdown(500, "", 1, false, false);
    expect(prices.hourlyPrice).toBe(0.04);
    expect(prices.dailyPrice).toBe(0.96);
    expect(prices.monthlyPrice).toBe(29.2);
    expect(prices.pricePerRu).toBe(0.00008);
    expect(prices.currency).toBe("USD");
    expect(prices.currencySign).toBe("$");
  });
});
