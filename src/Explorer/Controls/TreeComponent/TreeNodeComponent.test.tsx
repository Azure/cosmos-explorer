import { TreeItem, TreeItemLayout, tokens } from "@fluentui/react-components";
import { mount, shallow } from "enzyme";
import React from "react";
import { act } from "react-dom/test-utils";
import { TreeNode, TreeNodeComponent } from "./TreeNodeComponent";

class PromiseSource<T = void> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    /** Resolves the promise, then gets off the thread and waits until the currently-registered 'then' callback run. */
    async resolveAndWait(value: T): Promise<T> {
        this.resolve(value);
        return await this.promise;
    }
}

function generateTestNode(id: string, additionalProps?: Partial<TreeNode>): TreeNode {
    const node: TreeNode = {
        id,
        label: `${id}Label`,
        className: `${id}Class`,
        iconSrc: `${id}Icon`,
        onClick: jest.fn().mockName(`${id}Click`),
        ...additionalProps,
    };
    return node;
}


describe("TreeNodeComponent", () => {
    it("renders a single node", () => {
        const node = generateTestNode("root");
        const component = shallow(<TreeNodeComponent node={node} treeNodeId={node.id} />);
        expect(component).toMatchSnapshot();
        component.find(TreeItemLayout).props().onClick(null!);
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
                    isDisabled: true
                }
            ]
        });
        const component = shallow(<TreeNodeComponent node={node} treeNodeId={node.id} />);
        expect(component).toMatchSnapshot();
    });

    it("renders a loading spinner if the node is loading", async () => {
        const loading = new PromiseSource();
        const node = generateTestNode("root", {
            onExpanded: () => loading.promise,
        });
        const component = shallow(<TreeNodeComponent node={node} treeNodeId={node.id} />);

        act(() => {
            component.find(TreeItem).props().onOpenChange(null!, { open: true, value: "borp", target: null!, event: null!, type: "Click" });
        });

        expect(component).toMatchSnapshot("loading");
        await loading.resolveAndWait();
        expect(component).toMatchSnapshot("loaded");
    });

    it("renders single selected leaf node as selected", () => {
        const node = generateTestNode("root", {
            isSelected: () => true,
        });
        const component = shallow(<TreeNodeComponent node={node} treeNodeId={node.id} />);
        expect(component.find(TreeItemLayout).props().style?.backgroundColor).toStrictEqual(tokens.colorNeutralBackground1Selected);
        expect(component).toMatchSnapshot();
    });

    it("renders selected parent node as selected if no descendant nodes are selected", () => {
        const node = generateTestNode("root", {
            isSelected: () => true,
            children: [
                generateTestNode("child1", {
                    children: [
                        generateTestNode("grandchild1"),
                        generateTestNode("grandchild2"),
                    ]
                }),
                generateTestNode("child2"),
            ]
        });
        const component = shallow(<TreeNodeComponent node={node} treeNodeId={node.id} />);
        expect(component.find(TreeItemLayout).props().style?.backgroundColor).toStrictEqual(tokens.colorNeutralBackground1Selected);
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
                    ]
                }),
                generateTestNode("child2"),
            ]
        });
        const component = shallow(<TreeNodeComponent node={node} treeNodeId={node.id} />);
        expect(component.find(TreeItemLayout).props().style?.backgroundColor).toBeUndefined();
        expect(component).toMatchSnapshot();
    });

    it("renders an icon if the node has one", () => {
        const node = generateTestNode("root", {
            iconSrc: "the-icon.svg",
        });
        const component = shallow(<TreeNodeComponent node={node} treeNodeId={node.id} />);
        expect(component).toMatchSnapshot();
    });

    it("does not render children if the node is loading", () => {
        const node = generateTestNode("root", {
            isLoading: true,
            children: [
                generateTestNode("child1", {
                    children: [
                        generateTestNode("grandchild1"),
                        generateTestNode("grandchild2"),
                    ]
                }),
                generateTestNode("child2"),
            ]
        });
        const component = shallow(<TreeNodeComponent node={node} treeNodeId={node.id} />);
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
                    ]
                }),
                generateTestNode("child2Loading", {
                    isLoading: true,
                    children: [
                        generateTestNode("grandchild3NotRendered"),
                    ]
                }),
                generateTestNode("child3Expanding", {
                    onExpanded: () => child3Loading.promise,
                })
            ]
        });
        const component = mount(<TreeNodeComponent node={node} treeNodeId={node.id} />);

        // Find and expand the child3Expanding node
        const expandingChild = component.find(TreeItem).filterWhere(n => n.props().value === "root/child3ExpandingLabel");
        act(() => {
            expandingChild.props().onOpenChange(null!, { open: true, value: "root/child3ExpandingLabel", target: null!, event: null!, type: "Click" });
        });

        expect(component).toMatchSnapshot();
    });
});
