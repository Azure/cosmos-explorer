import * as ko from "knockout";
import { CommandButtonComponent, CommandButtonOptions } from "./CommandButton";

const mockLabel = "Some Label";
const id = "Some id";

function buildComponent(buttonOptions: any) {
  document.body.innerHTML = CommandButtonComponent.template as any;
  const vm = new CommandButtonComponent.viewModel(buttonOptions);
  ko.applyBindings(vm);
}

describe("Command Button Component", () => {
  function buildButtonOptions(
    onClick: () => void,
    id?: string,
    label?: string,
    disabled?: ko.Observable<boolean>,
    visible?: ko.Observable<boolean>,
    tooltipText?: string
  ): { buttonProps: CommandButtonOptions } {
    return {
      buttonProps: {
        iconSrc: "images/AddCollection.svg",
        id: id,
        commandButtonLabel: label || mockLabel,
        disabled: disabled,
        visible: visible,
        tooltipText: tooltipText,
        hasPopup: false,
        onCommandClick: onClick
      }
    };
  }

  function buildSplitterButtonOptions(
    onClick: () => void,
    id?: string,
    label?: string,
    disabled?: ko.Observable<boolean>,
    visible?: ko.Observable<boolean>,
    tooltipText?: string
  ): { buttonProps: CommandButtonOptions } {
    const child: CommandButtonOptions = {
      iconSrc: "images/settings_15x15.svg",
      id: id,
      commandButtonLabel: label || mockLabel,
      disabled: disabled,
      visible: visible,
      tooltipText: tooltipText,
      hasPopup: false,
      onCommandClick: onClick
    };

    return {
      buttonProps: {
        iconSrc: "images/AddCollection.svg",
        id: id,
        commandButtonLabel: label || mockLabel,
        disabled: disabled,
        visible: visible,
        tooltipText: tooltipText,
        hasPopup: false,
        onCommandClick: onClick,
        children: [child]
      }
    };
  }

  afterEach(() => {
    ko.cleanNode(document);
    document.body.innerHTML = "";
  });

  describe("Rendering", () => {
    it("should display button label", () => {
      const buttonOptions = buildButtonOptions(() => {
        /** do nothing **/
      }, mockLabel);
      buildComponent(buttonOptions);
      expect(document.getElementsByClassName("commandButtonComponent").item(0).textContent).toContain(mockLabel);
    });

    it("should display button icon", () => {
      const buttonOptions = buildButtonOptions(() => {
        /** do nothing **/
      });
      buildComponent(buttonOptions);
      expect(
        document
          .getElementsByTagName("img")
          .item(0)
          .getAttribute("src")
      ).toBeDefined();
    });
  });

  describe("Behavior", () => {
    let clickSpy: jasmine.Spy;

    beforeEach(() => {
      clickSpy = jasmine.createSpy("Command button click spy");
    });

    it("should trigger the click handler when the command button is clicked", () => {
      const buttonOptions = buildButtonOptions(() => clickSpy());
      buildComponent(buttonOptions);
      document
        .getElementsByClassName("commandButtonComponent")
        .item(0)
        .dispatchEvent(new Event("click"));
      expect(clickSpy).toHaveBeenCalled();
    });

    it("should not trigger the click handler when command button is disabled", () => {
      const buttonOptions = buildButtonOptions(() => clickSpy(), id, mockLabel, ko.observable(true));
      buildComponent(buttonOptions);
      document
        .getElementsByClassName("commandButtonComponent")
        .item(0)
        .dispatchEvent(new Event("click"));
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("should not have a dropdown if it has no child", () => {
      const buttonOptions = buildButtonOptions(() => clickSpy(), id, mockLabel, ko.observable(true));
      buildComponent(buttonOptions);
      const dropdownSize = document.getElementsByClassName("commandExpand").length;
      expect(dropdownSize).toBe(0);
    });

    it("should have a dropdown if it has a child", () => {
      const buttonOptions = buildSplitterButtonOptions(() => clickSpy(), id, mockLabel, ko.observable(true));
      buildComponent(buttonOptions);
      const dropdownSize = document.getElementsByClassName("commandExpand").length;
      expect(dropdownSize).toBe(1);
    });
  });
});
