import { TreeItem, TreeItemLayout } from "@fluentui/react-components";
import PromiseSource from "Utils/PromiseSource";
import { mount, shallow } from "enzyme";
import React from "react";
import { act } from "react-dom/test-utils";
import { TreeNode, TreeNodeComponent } from "./TreeNodeComponent";

function generateTestNode(id: string, additionalProps?: Partial<TreeNode>): TreeNode {
  const node: TreeNode = {
    id,
    label: `${id}Label`,
    className: "nodeIcon",
    iconSrc: `${id}Icon`,
    onClick: jest.fn().mockName(`${id}Click`),
    ...additionalProps,
  };
  return node;
}

describe("TreeNodeComponent", () => {
  it("renders a single node", () => {
    const node = generateTestNode("root");
    const component = shallow(<TreeNodeComponent openItems={[]} node={node} treeNodeId={node.id} />);
    expect(component).toMatchSnapshot();

    // The "click" handler is actually attached to onOpenChange, with a type of "Click".
    component
      .find(TreeItem)
      .props()
      .onOpenChange(null!, { open: true, value: "borp", target: null!, event: null!, type: "Click" });
    expect(node.onClick).toHaveBeenCalled();
  });

  it("renders a node with a menu", () => {
    const node = generateTestNode("root", {
      contextMenu: [
        {
          label: "enabledItem",
          onClick: jest.fn().mockName("enabledItemClick"),
        },
        {
          label: "disabledItem",
          onClick: jest.fn().mockName("disabledItemClick"),
          isDisabled: true,
        },
      ],
    });
    const component = shallow(<TreeNodeComponent openItems={[]} node={node} treeNodeId={node.id} />);
    expect(component).toMatchSnapshot();
  });

  it("renders a loading spinner if the node is loading", async () => {
    const loading = new PromiseSource();
    const node = generateTestNode("root", {
      onExpanded: () => loading.promise,
    });
    const component = shallow(<TreeNodeComponent openItems={[]} node={node} treeNodeId={node.id} />);

    act(() => {
      component
        .find(TreeItem)
        .props()
        .onOpenChange(null!, { open: true, value: "borp", target: null!, event: null!, type: "ExpandIconClick" });
    });

    expect(component).toMatchSnapshot("loading");
    await loading.resolveAndWait();
    expect(component).toMatchSnapshot("loaded");
  });

  it("renders single selected leaf node as selected", () => {
    const node = generateTestNode("root", {
      isSelected: () => true,
    });
    const component = shallow(<TreeNodeComponent openItems={[]} node={node} treeNodeId={node.id} />);
    expect(component).toMatchSnapshot();
  });

  it("renders selected parent node as selected if no descendant nodes are selected", () => {
    const node = generateTestNode("root", {
      isSelected: () => true,
      children: [
        generateTestNode("child1", {
          children: [generateTestNode("grandchild1"), generateTestNode("grandchild2")],
        }),
        generateTestNode("child2"),
      ],
    });
    const component = shallow(<TreeNodeComponent openItems={[]} node={node} treeNodeId={node.id} />);
    expect(component).toMatchSnapshot();
  });

  it("renders selected parent node as unselected if any descendant node is selected", () => {
    const node = generateTestNode("root", {
      isSelected: () => true,
      children: [
        generateTestNode("child1", {
          children: [
            generateTestNode("grandchild1", {
              isSelected: () => true,
            }),
            generateTestNode("grandchild2"),
          ],
        }),
        generateTestNode("child2"),
      ],
    });
    const component = shallow(<TreeNodeComponent openItems={[]} node={node} treeNodeId={node.id} />);
    expect(component.find(TreeItemLayout).props().style?.backgroundColor).toBeUndefined();
    expect(component).toMatchSnapshot();
  });

  it("renders an icon if the node has one", () => {
    const node = generateTestNode("root", {
      iconSrc: "the-icon.svg",
    });
    const component = shallow(<TreeNodeComponent openItems={[]} node={node} treeNodeId={node.id} />);
    expect(component).toMatchSnapshot();
  });

  it("renders a node as expandable if it has empty, but defined, children array", () => {
    const node = generateTestNode("root", {
      isLoading: true,
      children: [
        generateTestNode("child1", {
          children: [],
        }),
        generateTestNode("child2"),
      ],
    });
    const component = shallow(<TreeNodeComponent openItems={[]} node={node} treeNodeId={node.id} />);
    expect(component).toMatchSnapshot();
  });

  it("does not render children if the node is loading", () => {
    const node = generateTestNode("root", {
      isLoading: true,
      children: [
        generateTestNode("child1", {
          children: [generateTestNode("grandchild1"), generateTestNode("grandchild2")],
        }),
        generateTestNode("child2"),
      ],
    });
    const component = shallow(<TreeNodeComponent openItems={[]} node={node} treeNodeId={node.id} />);
    expect(component).toMatchSnapshot();
  });

  it("fully renders a tree", () => {
    const child3Loading = new PromiseSource();
    const node = generateTestNode("root", {
      isSelected: () => true,
      children: [
        generateTestNode("child1", {
          children: [
            generateTestNode("grandchild1", {
              iconSrc: "grandchild1Icon.svg",
              isSelected: () => true,
            }),
            generateTestNode("grandchild2"),
          ],
        }),
        generateTestNode("child2Loading", {
          isLoading: true,
          children: [generateTestNode("grandchild3NotRendered")],
        }),
        generateTestNode("child3Expanding", {
          onExpanded: () => child3Loading.promise,
        }),
      ],
    });
    const component = mount(<TreeNodeComponent openItems={[]} node={node} treeNodeId={node.id} />);

    // Find and expand the child3Expanding node
    const expandingChild = component.find(TreeItem).filterWhere((n) => n.props().value === "root/child3ExpandingLabel");
    act(() => {
      expandingChild.props().onOpenChange(null!, {
        open: true,
        value: "root/child3ExpandingLabel",
        target: null!,
        event: null!,
        type: "Click",
      });
    });

    expect(component).toMatchSnapshot();
  });
});
