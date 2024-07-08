import { shallow } from "enzyme";
import React from "react";
import { LegacyTreeComponent, LegacyTreeNode, LegacyTreeNodeComponent } from "./LegacyTreeComponent";

const buildChildren = (): LegacyTreeNode[] => {
  const grandChild11: LegacyTreeNode = {
    label: "ZgrandChild11",
  };
  const grandChild12: LegacyTreeNode = {
    label: "AgrandChild12",
  };
  const child1: LegacyTreeNode = {
    label: "Bchild1",
    children: [grandChild11, grandChild12],
  };

  const child2: LegacyTreeNode = {
    label: "2child2",
  };

  return [child1, child2];
};

const buildChildren2 = (): LegacyTreeNode[] => {
  const grandChild11: LegacyTreeNode = {
    label: "ZgrandChild11",
  };
  const grandChild12: LegacyTreeNode = {
    label: "AgrandChild12",
  };

  const child1: LegacyTreeNode = {
    label: "aChild",
  };

  const child2: LegacyTreeNode = {
    label: "bchild",
    children: [grandChild11, grandChild12],
  };

  const child3: LegacyTreeNode = {
    label: "cchild",
  };

  const child4: LegacyTreeNode = {
    label: "dchild",
    children: [grandChild11, grandChild12],
  };

  return [child1, child2, child3, child4];
};

describe("LegacyTreeComponent", () => {
  it("renders a simple tree", () => {
    const root = {
      label: "root",
      children: buildChildren(),
    };

    const props = {
      rootNode: root,
      className: "tree",
    };

    const wrapper = shallow(<LegacyTreeComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("LegacyTreeNodeComponent", () => {
  it("renders a simple node (sorted children, expanded)", () => {
    const node: LegacyTreeNode = {
      label: "label",
      id: "id",
      children: buildChildren(),
      contextMenu: [
        {
          label: "menuLabel",
          onClick: undefined,
          iconSrc: undefined,
          isDisabled: true,
        },
      ],
      iconSrc: undefined,
      isExpanded: true,
      className: "nodeClassname",
      isAlphaSorted: true,
      data: undefined,
      timestamp: 10,
      isSelected: undefined,
      onClick: undefined,
      onExpanded: undefined,
      onCollapsed: undefined,
    };

    const props = {
      node,
      generation: 12,
      paddingLeft: 23,
    };
    const wrapper = shallow(<LegacyTreeNodeComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders unsorted children by default", () => {
    const node: LegacyTreeNode = {
      label: "label",
      children: buildChildren(),
      isExpanded: true,
    };
    const props = {
      node,
      generation: 2,
      paddingLeft: 9,
    };
    const wrapper = shallow(<LegacyTreeNodeComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("does not render children by default", () => {
    const node: LegacyTreeNode = {
      label: "label",
      children: buildChildren(),
      isAlphaSorted: false,
    };
    const props = {
      node,
      generation: 2,
      paddingLeft: 9,
    };
    const wrapper = shallow(<LegacyTreeNodeComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders sorted children, expanded, leaves and parents separated", () => {
    const node: LegacyTreeNode = {
      label: "label",
      id: "id",
      children: buildChildren2(),
      contextMenu: [],
      iconSrc: undefined,
      isExpanded: true,
      className: "nodeClassname",
      isAlphaSorted: true,
      isLeavesParentsSeparate: true,
      data: undefined,
      timestamp: 10,
      isSelected: undefined,
      onClick: undefined,
      onExpanded: undefined,
      onCollapsed: undefined,
    };

    const props = {
      node,
      generation: 12,
      paddingLeft: 23,
    };
    const wrapper = shallow(<LegacyTreeNodeComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders loading icon", () => {
    const node: LegacyTreeNode = {
      label: "label",
      children: [],
      isExpanded: true,
    };

    const props = {
      node,
      generation: 2,
      paddingLeft: 9,
    };
    const wrapper = shallow(<LegacyTreeNodeComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
