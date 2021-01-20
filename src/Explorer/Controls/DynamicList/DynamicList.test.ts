import * as ko from "knockout";
import { DynamicListComponent, DynamicListParams, DynamicListItem } from "./DynamicListComponent";

const $ = (selector: string) => document.querySelector(selector) as HTMLElement;

function buildComponent(buttonOptions: any) {
  document.body.innerHTML = DynamicListComponent.template as any;
  const vm = new DynamicListComponent.viewModel(buttonOptions);
  ko.applyBindings(vm);
}

describe("Dynamic List Component", () => {
  const mockPlaceHolder = "Write here";
  const mockButton = "Add something";
  const mockValue = "/someText";
  const mockAriaLabel = "Add ariaLabel";
  const items: ko.ObservableArray<DynamicListItem> = ko.observableArray<DynamicListItem>();

  function buildListOptions(
    items: ko.ObservableArray<DynamicListItem>,
    placeholder?: string,
    mockButton?: string
  ): DynamicListParams {
    return {
      placeholder: placeholder,
      listItems: items,
      buttonText: mockButton,
      ariaLabel: mockAriaLabel,
    };
  }

  afterEach(() => {
    ko.cleanNode(document);
  });

  describe("Rendering", () => {
    it("should display button text", () => {
      const params = buildListOptions(items, mockPlaceHolder, mockButton);
      buildComponent(params);
      expect($(".dynamicListItemAdd").textContent).toContain(mockButton);
    });
  });

  describe("Behavior", () => {
    it("should add items to the list", () => {
      const params = buildListOptions(items, mockPlaceHolder, mockButton);
      buildComponent(params);
      $(".dynamicListItemAdd").click();
      expect(items().length).toBe(1);
      const input = document.getElementsByClassName("dynamicListItem").item(0).children[0];
      input.setAttribute("value", mockValue);
      input.dispatchEvent(new Event("change"));
      input.dispatchEvent(new Event("blur"));
      expect(items()[0].value()).toBe(mockValue);
    });

    it("should remove items from the list", () => {
      const params = buildListOptions(items, mockPlaceHolder);
      buildComponent(params);
      $(".dynamicListItemDelete").click();
      expect(items().length).toBe(0);
    });
  });
});
