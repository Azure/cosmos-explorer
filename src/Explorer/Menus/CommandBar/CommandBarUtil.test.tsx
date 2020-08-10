import { CommandBarUtil } from "./CommandBarUtil";
import * as ViewModels from "../../../Contracts/ViewModels";
import { ICommandBarItemProps } from "office-ui-fabric-react/lib/CommandBar";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";

describe("CommandBarUtil tests", () => {
  const createButton = (): CommandButtonComponentProps => {
    return {
      iconSrc: "icon",
      iconAlt: "label",
      onCommandClick: (e: React.SyntheticEvent): void => {},
      commandButtonLabel: "label",
      ariaLabel: "ariaLabel",
      hasPopup: true,
      disabled: true,
      tooltipText: "tooltipText",
      children: [],
      className: "className"
    };
  };

  it("should convert simple NavbarButtonConfig button", () => {
    const btn = createButton();
    const backgroundColor = "backgroundColor";

    const converteds = CommandBarUtil.convertButton([btn], backgroundColor);
    expect(converteds.length).toBe(1);
    const converted = converteds[0];
    expect(!converted.split);
    expect(converted.iconProps.imageProps.src).toEqual(btn.iconSrc);
    expect(converted.iconProps.imageProps.alt).toEqual(btn.iconAlt);
    expect(converted.onClick).toEqual(btn.onCommandClick);
    expect(converted.text).toEqual(btn.commandButtonLabel);
    expect(converted.ariaLabel).toEqual(btn.ariaLabel);
    expect(converted.disabled).toEqual(btn.disabled);
    expect(converted.className).toEqual(btn.className);
  });

  it("should convert NavbarButtonConfig to split button", () => {
    const btn = createButton();
    for (let i = 0; i < 3; i++) {
      const child = createButton();
      child.commandButtonLabel = `child${i}`;
      btn.children.push(child);
    }

    const converteds = CommandBarUtil.convertButton([btn], "backgroundColor");
    expect(converteds.length).toBe(1);
    const converted = converteds[0];
    expect(converted.split);
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

    const converteds = CommandBarUtil.convertButton(btns, "backgroundColor");
    const keys = converteds.map((btn: ICommandBarItemProps) => btn.key);
    const uniqueKeys = converteds
      .map((btn: ICommandBarItemProps) => btn.key)
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
    expect(uniqueKeys.length).toBe(btns.length);
  });

  it("should create icon buttons with tooltips", () => {
    const btn = createButton();
    const backgroundColor = "backgroundColor";

    btn.commandButtonLabel = null;
    let converted = CommandBarUtil.convertButton([btn], backgroundColor)[0];
    expect(converted.text).toEqual(btn.tooltipText);

    converted = CommandBarUtil.convertButton([btn], backgroundColor)[0];
    delete btn.commandButtonLabel;
    expect(converted.text).toEqual(btn.tooltipText);
  });
});
