import { shallow } from "enzyme";
import React from "react";
import { GraphHighlightedNodeData } from "./GraphExplorer";
import {
  ReadOnlyNodePropertiesComponent,
  ReadOnlyNodePropertiesComponentProps,
} from "./ReadOnlyNodePropertiesComponent";

describe("<ReadOnlyNodePropertiesComponent />", () => {
  const id = "myId";
  const label = "myLabel";
  const mockNode: GraphHighlightedNodeData = {
    id: id,
    label: label,
    properties: {
      key1: ["value1"],
      key2: ["value2"],
    },
    areNeighborsUnknown: false,
    sources: [],
    targets: [],
  };

  it("renders id", () => {
    const props: ReadOnlyNodePropertiesComponentProps = { node: mockNode };
    const wrapper = shallow(<ReadOnlyNodePropertiesComponent {...props} />);
    expect(wrapper.find(".vertexId").text()).toBe(id);
  });

  it("renders label", () => {
    const props: ReadOnlyNodePropertiesComponentProps = { node: mockNode };
    const wrapper = shallow(<ReadOnlyNodePropertiesComponent {...props} />);
    expect(wrapper.find(".vertexLabel").text()).toBe(label);
  });

  it("renders properties (single value)", () => {
    const props: ReadOnlyNodePropertiesComponentProps = { node: mockNode };
    const wrapper = shallow(<ReadOnlyNodePropertiesComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders properties (with multiple values)", () => {
    const mockNode2 = {
      ...mockNode,
      properties: {
        key3: ["abcd", 1234, true, false, undefined],
      },
    };
    const props: ReadOnlyNodePropertiesComponentProps = { node: mockNode2 };
    const wrapper = shallow(<ReadOnlyNodePropertiesComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders unicode", () => {
    const mockNode2 = {
      ...mockNode,
      properties: {
        key4: ["あきら, アキラ,安喜良"],
        key5: ["Véronique"],
      },
    };
    const props: ReadOnlyNodePropertiesComponentProps = { node: mockNode2 };
    const wrapper = shallow(<ReadOnlyNodePropertiesComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
