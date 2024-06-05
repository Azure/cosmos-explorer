import { makeStyles, tokens, treeItemLevelToken } from "@fluentui/react-components";
import { cosmosShorthands } from "Explorer/Theme/ThemeUtil";

export type TreeStyleName = keyof ReturnType<typeof useTreeStyles>;

const treeLeftPaddingToken = "--cosmos-Tree--leftPadding" as const;

export const useTreeStyles = makeStyles({
  tree: {
    rowGap: "0px",
    paddingTop: "0px",
    [treeLeftPaddingToken]: "10px",
  },
  treeItemLayout: {
    minHeight: '36px',
    ...cosmosShorthands.borderBottom(),
  },
  leafItemLayout: {
    // Expanded from the built-in style, to allow for some extra padding on the left
    // See https://github.com/microsoft/fluentui/blob/84bf9cc70812a458563435352c49d4423b19f2fc/packages/react-components/react-tree/src/components/TreeItemLayout/useTreeItemLayoutStyles.styles.ts#L49
    paddingLeft: `calc(calc(var(${treeItemLevelToken}, 1) * ${tokens.spacingHorizontalXXL}) + var(${treeLeftPaddingToken}))`,
  },
  branchItemLayout: {
    // Expanded from the built-in style, to allow for some extra padding on the left
    // See https://github.com/microsoft/fluentui/blob/84bf9cc70812a458563435352c49d4423b19f2fc/packages/react-components/react-tree/src/components/TreeItemLayout/useTreeItemLayoutStyles.styles.ts#L49
    paddingLeft: `calc(calc((var(${treeItemLevelToken}, 1) - 1) * ${tokens.spacingHorizontalXXL}) + var(${treeLeftPaddingToken}))`,
  },
  selectedItem: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },
  treeIcon: {
    height: "14px",
    width: "14px",
  },
  databaseNode: {
    fontWeight: tokens.fontWeightSemibold,
  },
  collectionNode: {
    fontWeight: tokens.fontWeightSemibold,
  },
  loadMoreNode: {
    color: tokens.colorBrandForegroundLink,
  },
});