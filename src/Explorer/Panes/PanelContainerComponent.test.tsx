import { shallow } from "enzyme";
import React from "react";
import { PanelContainerComponent, PanelContainerProps } from "./PanelContainerComponent";

describe("PaneContainerComponent test", () => {
  it("should render with panel content and header", () => {
    const panelContainerProps: PanelContainerProps = {
      headerText: "test",
      panelContent: <div></div>,
      isOpen: true,
      isConsoleExpanded: false,
      closePanel: undefined,
    };
    const wrapper = shallow(<PanelContainerComponent {...panelContainerProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render nothing if content is undefined", () => {
    const panelContainerProps: PanelContainerProps = {
      headerText: "test",
      panelContent: undefined,
      isOpen: true,
      isConsoleExpanded: false,
      closePanel: undefined,
    };
    const wrapper = shallow(<PanelContainerComponent {...panelContainerProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should be resize if notification console is expanded", () => {
    const panelContainerProps: PanelContainerProps = {
      headerText: "test",
      panelContent: <div></div>,
      isOpen: true,
      isConsoleExpanded: true,
      closePanel: undefined,
    };
    const wrapper = shallow(<PanelContainerComponent {...panelContainerProps} />);
    expect(wrapper).toMatchSnapshot();
  });
});
