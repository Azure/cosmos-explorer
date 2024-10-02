import { ICommandBarItemProps } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import * as CommandBarUtil from "./CommandBarUtil";

describe("CommandBarUtil tests", () => {
  const mockExplorer = {} as Explorer;
  const createButton = (): CommandButtonComponentProps => {
    return {
      iconSrc: "icon",
      iconAlt: "label",
      onCommandClick: jest.fn(),
      commandButtonLabel: "label",
      ariaLabel: "ariaLabel",
      hasPopup: true,
      disabled: true,
      tooltipText: "tooltipText",
      children: [],
      className: "className",
    };
  };

  it("should convert simple NavbarButtonConfig button", () => {
    const btn = createButton();
    const backgroundColor = "backgroundColor";

    const converteds = CommandBarUtil.convertButton([btn], backgroundColor, mockExplorer);
    expect(converteds.length).toBe(1);
    const converted = converteds[0];
    expect(converted.split).toBe(undefined);
    expect(converted.iconProps.imageProps.src).toEqual(btn.iconSrc);
    expect(converted.iconProps.imageProps.alt).toEqual(btn.iconAlt);
    expect(converted.text).toEqual(btn.commandButtonLabel);
    expect(converted.ariaLabel).toEqual(btn.ariaLabel);
    expect(converted.disabled).toEqual(btn.disabled);
    expect(converted.className).toEqual(btn.className);

    // Click gets called
    converted.onClick();
    expect(btn.onCommandClick).toHaveBeenCalled();
  });

  it("should convert NavbarButtonConfig to split button", () => {
    const btn = createButton();
    for (let i = 0; i < 3; i++) {
      const child = createButton();
      child.commandButtonLabel = `child${i}`;
      btn.children.push(child);
    }

    const converteds = CommandBarUtil.convertButton([btn], "backgroundColor", mockExplorer);
    expect(converteds.length).toBe(1);
    const converted = converteds[0];
    expect(converted.split).toBe(true);
    expect(converted.subMenuProps.items.length).toBe(btn.children.length);
    for (let i = 0; i < converted.subMenuProps.items.length; i++) {
      expect(converted.subMenuProps.items[i].text).toEqual(btn.children[i].commandButtonLabel);
    }
  });

  it("should create buttons with unique keys", () => {
    const btns: CommandButtonComponentProps[] = [];
    for (let i = 0; i < 5; i++) {
      btns.push(createButton());
    }

    const converteds = CommandBarUtil.convertButton(btns, "backgroundColor", mockExplorer);
    const uniqueKeys = converteds
      .map((btn: ICommandBarItemProps) => btn.key)
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
    expect(uniqueKeys.length).toBe(btns.length);
  });

  it("should create icon buttons with tooltips", () => {
    const btn = createButton();
    const backgroundColor = "backgroundColor";

    btn.commandButtonLabel = undefined;
    let converted = CommandBarUtil.convertButton([btn], backgroundColor, mockExplorer)[0];
    expect(converted.text).toEqual(btn.tooltipText);

    converted = CommandBarUtil.convertButton([btn], backgroundColor, mockExplorer)[0];
    delete btn.commandButtonLabel;
    expect(converted.text).toEqual(btn.tooltipText);
  });
});
