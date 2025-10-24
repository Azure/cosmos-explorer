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
  manualToAutoscaleDisclaimerElement,
  mongoIndexTransformationRefreshingMessage,
  mongoIndexingPolicyAADError,
  mongoIndexingPolicyDisclaimer,
  renderMongoIndexTransformationRefreshMessage,
  ttlWarning,
  updateThroughputDelayedApplyWarningMessage,
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

  describe("getRuPriceBreakdown", () => {
    it("should return correct price breakdown for a manual RU setting of 500, 1 region, multimaster disabled", () => {
      const prices = getRuPriceBreakdown(500, "", 1, false, false);
      expect(prices.hourlyPrice).toBe(0.04);
      expect(prices.dailyPrice).toBe(0.96);
      expect(prices.monthlyPrice).toBe(29.2);
      expect(prices.pricePerRu).toBe(0.00008);
      expect(prices.currency).toBe("USD");
      expect(prices.currencySign).toBe("$");
    });

    it("should return correct price breakdown for autoscale", () => {
      const prices = getRuPriceBreakdown(1000, "", 1, false, true);
      // For autoscale, the baseline RU is 10% of max RU
      expect(prices.hourlyPrice).toBe(0.12); // Higher because autoscale pricing is different
      expect(prices.dailyPrice).toBe(2.88); // hourlyPrice * 24
      expect(prices.monthlyPrice).toBe(87.6); // hourlyPrice * 730
      expect(prices.pricePerRu).toBe(0.00012); // Autoscale price per RU
      expect(prices.currency).toBe("USD");
      expect(prices.currencySign).toBe("$");
    });

    it("should return correct price breakdown for multimaster", () => {
      const prices = getRuPriceBreakdown(500, "", 2, true, false);
      // For multimaster with 2 regions, price is multiplied by 4
      expect(prices.hourlyPrice).toBe(0.16); // Base price * 4
      expect(prices.dailyPrice).toBe(3.84); // hourlyPrice * 24
      expect(prices.monthlyPrice).toBe(116.8); // hourlyPrice * 730
      expect(prices.pricePerRu).toBe(0.00016); // Base price per RU * 2 (regions) * 2 (multimaster)
      expect(prices.currency).toBe("USD");
      expect(prices.currencySign).toBe("$");
    });
  });

  describe("message formatting", () => {
    it("should format throughput apply delayed message correctly", () => {
      const message = getThroughputApplyDelayedMessage(false, 1000, "RU/s", "testDb", "testColl", 2000);
      const wrapper = shallow(message);
      const text = wrapper.text();
      expect(text).toContain("testDb");
      expect(text).toContain("testColl");
      expect(text).toContain("Current manual throughput: 1000 RU/s");
      expect(text).toContain("Target manual throughput: 2000");
    });

    it("should format autoscale throughput message correctly", () => {
      const message = getThroughputApplyDelayedMessage(true, 1000, "RU/s", "testDb", "testColl", 2000);
      const wrapper = shallow(message);
      const text = wrapper.text();
      expect(text).toContain("Current autoscale throughput: 100 - 1000 RU/s");
      expect(text).toContain("Target autoscale throughput: 200 - 2000 RU/s");
    });
  });

  describe("estimated spending element", () => {
    // Mock Stack component since we're using shallow rendering
    const mockStack = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

    beforeEach(() => {
      jest.mock("@fluentui/react", () => ({
        ...jest.requireActual("@fluentui/react"),
        Stack: mockStack,
      }));
    });

    afterEach(() => {
      jest.resetModules();
    });

    it("should render correct spending info for manual throughput", () => {
      const costElement = <div>Cost</div>;
      const priceBreakdown: PriceBreakdown = {
        hourlyPrice: 1.0,
        dailyPrice: 24.0,
        monthlyPrice: 730.0,
        pricePerRu: 0.0001,
        currency: "USD",
        currencySign: "$",
      };

      const element = getEstimatedSpendingElement(costElement, 1000, 1, priceBreakdown, false);
      const wrapper = shallow(element);
      const spendElement = wrapper.find("#throughputSpendElement");

      expect(spendElement.find("span").at(0).text()).toBe("1 region");
      expect(spendElement.find("span").at(1).text()).toBe("1000 RU/s");
      expect(spendElement.find("span").at(2).text()).toBe("$0.0001/RU");
    });

    it("should render correct spending info for autoscale throughput", () => {
      const costElement = <div>Cost</div>;
      const priceBreakdown: PriceBreakdown = {
        hourlyPrice: 1.0,
        dailyPrice: 24.0,
        monthlyPrice: 730.0,
        pricePerRu: 0.0001,
        currency: "USD",
        currencySign: "$",
      };

      const element = getEstimatedSpendingElement(costElement, 1000, 1, priceBreakdown, true);
      const wrapper = shallow(element);
      const spendElement = wrapper.find("#throughputSpendElement");

      expect(spendElement.find("span").at(1).text()).toBe("100 RU/s - 1000 RU/s");
    });
  });
});
