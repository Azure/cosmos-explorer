import { render, screen } from "@testing-library/react";
import React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { IGraphConfig } from "../../Tabs/GraphTab";
import { GraphStyleComponent, GraphStyleProps } from "./GraphStyleComponent";

describe("Graph Style Component", () => {
  let fakeGraphConfig: IGraphConfig;
  let fakeGraphConfigUiData: ViewModels.IGraphConfigUiData;
  let props: GraphStyleProps;
  beforeEach(() => {
    fakeGraphConfig = {
      nodeColor: "orange",
      nodeColorKey: "node2",
      linkColor: "orange",
      showNeighborType: 0,
      nodeCaption: "node1",
      nodeSize: 10,
      linkWidth: 1,
      nodeIconKey: undefined,
      iconsMap: {},
    };
    fakeGraphConfigUiData = {
      nodeCaptionChoice: "node1",
      nodeIconChoice: undefined,
      nodeColorKeyChoice: "node2",
      nodeIconSet: undefined,
      nodeProperties: ["node1", "node2", "node3"],
      nodePropertiesWithNone: ["none", "node1", "node2", "node3"],
      showNeighborType: undefined,
    };
    props = {
      igraphConfig: fakeGraphConfig,
      igraphConfigUiData: fakeGraphConfigUiData,
      getValues: (): void => undefined,
    };

    render(<GraphStyleComponent {...props} />);
  });

  it("should render default property", () => {
    const { asFragment } = render(<GraphStyleComponent {...props} />);
    expect(asFragment).toMatchSnapshot();
  });

  it("should render node properties dropdown list ", () => {
    const dropDownList = screen.getByText("Show vertex (node) as");
    expect(dropDownList).toBeDefined();
  });

  it("should render Map this property to node color dropdown list", () => {
    const nodeColorDropdownList = screen.getByText("Map this property to node color");
    expect(nodeColorDropdownList).toBeDefined();
  });

  it("should render show neighbor options", () => {
    const nodeShowNeighborOptions = screen.getByText("Show");
    expect(nodeShowNeighborOptions).toBeDefined();
  });

  it("should call handleOnChange method", () => {
    const handleOnChange = jest.fn();
    const nodeCaptionDropdownList = screen.getByText("Show vertex (node) as");
    nodeCaptionDropdownList.onchange = handleOnChange();
    expect(handleOnChange).toHaveBeenCalled();
  });
});
