import { TreeItem, TreeItemLayout } from "@fluentui/react-components";
import type { Frame } from "@playwright/test";
import PromiseSource from "Utils/PromiseSource";
import { mount, shallow } from "enzyme";
import React from "react";
import { act } from "react-dom/test-utils";
import { DataExplorer } from "../../../../test/fx";
import { TreeNode, TreeNodeComponent } from "./TreeNodeComponent";

jest.mock("@playwright/test", () => ({}));

describe("Tree expansion helper", () => {
  const createNode = () => {
    const expandIcon = { click: jest.fn().mockResolvedValue(undefined) };
    const row = { locator: jest.fn().mockReturnValue(expandIcon), click: jest.fn() };
    const container = { getAttribute: jest.fn().mockResolvedValue("false") };
    const tree = { waitFor: jest.fn().mockResolvedValue(undefined) };
    const frame = {
      getByTestId: jest.fn((id: string) => {
        if (id === "TreeNode:root") {
          return row;
        }
        if (id === "TreeNodeContainer:root") {
          return container;
        }
        if (id === "Tree:root") {
          return tree;
        }
        throw new Error(`Unexpected locator: ${id}`);
      }),
    } as unknown as Frame;
    return { node: new DataExplorer(frame).treeNode("root"), row, container, tree, expandIcon };
  };

  it("clicks the expand icon rather than the row that contains menu actions", async () => {
    const { node, row, expandIcon } = createNode();
    await node.expand();
    expect(row.locator).toHaveBeenCalledWith(":scope > .fui-TreeItemLayout__expandIcon");
    expect(expandIcon.click).toHaveBeenCalledTimes(1);
    expect(row.click).not.toHaveBeenCalled();
  });

  it("does not toggle a node that is already expanded", async () => {
    const { node, row, container, tree, expandIcon } = createNode();
    container.getAttribute.mockResolvedValue("true");
    await node.expand();
    expect(tree.waitFor).toHaveBeenCalled();
    expect(expandIcon.click).not.toHaveBeenCalled();
    expect(row.click).not.toHaveBeenCalled();
  });

  it("uses the expand icon again when a collapsed node needs a retry", async () => {
    const { node, row, tree, expandIcon } = createNode();
    tree.waitFor.mockRejectedValueOnce(new Error("Children are not visible yet"));
    await node.expand();
    expect(expandIcon.click).toHaveBeenCalledTimes(2);
    expect(row.click).not.toHaveBeenCalled();
  });

  it("does not collapse a node that expanded while waiting for children", async () => {
    const { node, container, tree, expandIcon } = createNode();
    container.getAttribute.mockResolvedValueOnce("false").mockResolvedValue("true");
    tree.waitFor.mockRejectedValueOnce(new Error("Children are not visible yet"));
    await node.expand();
    expect(expandIcon.click).toHaveBeenCalledTimes(1);
    expect(tree.waitFor).toHaveBeenCalledTimes(2);
  });
});

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
