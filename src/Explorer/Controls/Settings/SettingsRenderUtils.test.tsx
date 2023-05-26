import { shallow } from "enzyme";
import React from "react";
import {
  PriceBreakdown,
  changeFeedPolicyToolTip,
  conflictResolutionCustomToolTip,
  conflictResolutionLwwTooltip,
  getEstimatedSpendingElement,
  getRuPriceBreakdown,
  getThroughputApplyDelayedMessage,
  getThroughputApplyLongDelayMessage,
  getThroughputApplyShortDelayMessage,
  getToolTipContainer,
  indexingPolicynUnsavedWarningMessage,
  manualToAutoscaleDisclaimerElement,
  mongoIndexTransformationRefreshingMessage,
  mongoIndexingPolicyAADError,
  mongoIndexingPolicyDisclaimer,
  renderMongoIndexTransformationRefreshMessage,
  ttlWarning,
  updateThroughputBeyondLimitWarningMessage,
  updateThroughputDelayedApplyWarningMessage
} from "./SettingsRenderUtils";

class SettingsRenderUtilsTestComponent extends React.Component {
  public render(): JSX.Element {
    const costElement: JSX.Element = <></>;
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
        {getEstimatedSpendingElement(costElement, 1000, 2, priceBreakdown, false)}

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
