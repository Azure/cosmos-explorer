import { shallow } from "enzyme";
import React from "react";
import { PanelContainerComponent, PanelContainerProps } from "./PanelContainerComponent";

describe("PaneContainerComponent test", () => {
  it("should not render console with panel", () => {
    const panelContainerProps: PanelContainerProps = {
      headerText: "test",
      panelContent: <div></div>,
      isOpen: true,
      hasConsole: false,
      isConsoleExpanded: false,
    };
    const wrapper = shallow(<PanelContainerComponent {...panelContainerProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render with panel content and header", () => {
    const panelContainerProps: PanelContainerProps = {
      headerText: "test",
      panelContent: <div></div>,
      isOpen: true,
      hasConsole: true,
      isConsoleExpanded: false,
    };
    const wrapper = shallow(<PanelContainerComponent {...panelContainerProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render nothing if content is undefined", () => {
    const panelContainerProps: PanelContainerProps = {
      headerText: "test",
      panelContent: undefined,
      isOpen: true,
      hasConsole: true,
      isConsoleExpanded: false,
    };
    const wrapper = shallow(<PanelContainerComponent {...panelContainerProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should be resize if notification console is expanded", () => {
    const panelContainerProps: PanelContainerProps = {
      headerText: "test",
      panelContent: <div></div>,
      isOpen: true,
      hasConsole: true,
      isConsoleExpanded: true,
    };
    const wrapper = shallow(<PanelContainerComponent {...panelContainerProps} />);
    expect(wrapper).toMatchSnapshot();
  });
});
