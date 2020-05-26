import * as ko from "knockout";
import * as ViewModels from "../../../Contracts/ViewModels";
import editable from "../../../Common/EditableUtility";
import { ThroughputInputComponent, ThroughputInputParams, ThroughputInputViewModel } from "./ThroughputInputComponent";

const $ = (selector: string) => document.querySelector(selector) as HTMLElement;

describe.skip("Throughput Input Component", () => {
  let component: any;
  let vm: ThroughputInputViewModel;
  const testId: string = "ThroughputValue";
  const value: ViewModels.Editable<number> = editable.observable(500);
  const minimum: ko.Observable<number> = ko.observable(400);
  const maximum: ko.Observable<number> = ko.observable(2000);

  function buildListOptions(
    value: ViewModels.Editable<number>,
    minimum: ko.Observable<number>,
    maxium: ko.Observable<number>,
    canExceedMaximumValue?: boolean
  ): ThroughputInputParams {
    return {
      testId,
      value,
      minimum,
      maximum,
      canExceedMaximumValue: ko.computed<boolean>(() => Boolean(canExceedMaximumValue)),
      costsVisible: ko.observable(false),
      isFixed: false,
      label: ko.observable("Label"),
      requestUnitsUsageCost: ko.observable("requestUnitsUsageCost"),
      showAsMandatory: false,
      autoPilotTiersList: null,
      autoPilotUsageCost: null,
      isAutoPilotSelected: null,
      selectedAutoPilotTier: null,
      throughputAutoPilotRadioId: null,
      throughputProvisionedRadioId: null,
      throughputModeRadioName: null
    };
  }

  function simulateKeyPressSpace(target: HTMLElement): Promise<boolean> {
    const event = new KeyboardEvent("keydown", {
      key: "space"
    });

    const result = target.dispatchEvent(event);

    return new Promise(resolve => {
      setTimeout(() => {
        resolve(result);
      }, 1000);
    });
  }

  beforeEach(() => {
    component = ThroughputInputComponent;
    document.body.innerHTML = component.template as any;
  });

  afterEach(async () => {
    await ko.cleanNode(document);
  });

  describe("Rendering", () => {
    it("should display value text", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum));
      await ko.applyBindings(vm);
      expect(($("input") as HTMLInputElement).value).toContain(value().toString());
    });
  });

  describe("Behavior", () => {
    it("should decrease value", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum));
      await ko.applyBindings(vm);
      value(450);
      $(".testhook-decreaseThroughput").click();
      expect(value()).toBe(400);
      $(".testhook-decreaseThroughput").click();
      expect(value()).toBe(400);
    });

    it("should increase value", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum));
      await ko.applyBindings(vm);
      value(1950);
      $(".test-increaseThroughput").click();
      expect(value()).toBe(2000);
      $(".test-increaseThroughput").click();
      expect(value()).toBe(2000);
    });

    it("should respect lower bound limits", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum));
      await ko.applyBindings(vm);
      value(minimum());
      $(".testhook-decreaseThroughput").click();
      expect(value()).toBe(minimum());
    });

    it("should respect upper bound limits", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum));
      await ko.applyBindings(vm);
      value(maximum());
      $(".test-increaseThroughput").click();
      expect(value()).toBe(maximum());
    });

    it("should allow throughput to exceed upper bound limit when canExceedMaximumValue is set", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum, true));
      await ko.applyBindings(vm);
      value(maximum());
      $(".test-increaseThroughput").click();
      expect(value()).toBe(maximum() + 100);
    });
  });

  describe("Accessibility", () => {
    it.skip("should decrease value with keypress", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum));
      await ko.applyBindings(vm);
      const target = $(".testhook-decreaseThroughput");

      value(500);
      expect(value()).toBe(500);

      const result = await simulateKeyPressSpace(target);
      expect(value()).toBe(400);
    });

    it.skip("should increase value with keypress", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum));
      await ko.applyBindings(vm);
      const target = $(".test-increaseThroughput");

      value(400);
      expect(value()).toBe(400);

      const result = await simulateKeyPressSpace(target);
      //    expect(value()).toBe(500);
    });

    it("should set the decreaseButtonAriaLabel using the default step value", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum, true));
      await ko.applyBindings(vm);
      expect(vm.decreaseButtonAriaLabel).toBe("Decrease throughput by 100");
    });

    it("should set the increaseButtonAriaLabel using the default step value", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum, true));
      await ko.applyBindings(vm);
      expect(vm.increaseButtonAriaLabel).toBe("Increase throughput by 100");
    });

    it("should set the increaseButtonAriaLabel using the params step value", async () => {
      const options = buildListOptions(value, minimum, maximum, true);
      options.step = 10;
      vm = new component.viewModel(options);
      await ko.applyBindings(vm);
      expect(vm.increaseButtonAriaLabel).toBe("Increase throughput by 10");
    });

    it("should set the decreaseButtonAriaLabel using the params step value", async () => {
      const options = buildListOptions(value, minimum, maximum, true);
      options.step = 10;
      vm = new component.viewModel(options);
      await ko.applyBindings(vm);
      expect(vm.decreaseButtonAriaLabel).toBe("Decrease throughput by 10");
    });

    it("should set the decreaseButtonAriaLabel using the params step value", async () => {
      const options = buildListOptions(value, minimum, maximum, true);
      options.step = 10;
      vm = new component.viewModel(options);
      await ko.applyBindings(vm);
    });

    it("should have aria-label attribute on increase button", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum, true));
      await ko.applyBindings(vm);
      const ariaLabel = $(".test-increaseThroughput").attributes.getNamedItem("aria-label").value;
      expect(ariaLabel).toBe("Increase throughput by 100");
    });

    it("should have aria-label attribute on increase button", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum, true));
      await ko.applyBindings(vm);
      const ariaLabel = $(".testhook-decreaseThroughput").attributes.getNamedItem("aria-label").value;
      expect(ariaLabel).toBe("Decrease throughput by 100");
    });

    it("should have role on increase button", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum, true));
      await ko.applyBindings(vm);
      const role = $(".test-increaseThroughput").attributes.getNamedItem("role").value;
      expect(role).toBe("button");
    });

    it("should have role on decrease button", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum, true));
      await ko.applyBindings(vm);
      const role = $(".testhook-decreaseThroughput").attributes.getNamedItem("role").value;
      expect(role).toBe("button");
    });

    it("should have tabindex 0 on increase button", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum, true));
      await ko.applyBindings(vm);
      const role = $(".testhook-decreaseThroughput").attributes.getNamedItem("tabindex").value;
      expect(role).toBe("0");
    });

    it("should have tabindex 0 on decrease button", async () => {
      vm = new component.viewModel(buildListOptions(value, minimum, maximum, true));
      await ko.applyBindings(vm);
      const role = $(".testhook-decreaseThroughput").attributes.getNamedItem("tabindex").value;
      expect(role).toBe("0");
    });
  });
});
