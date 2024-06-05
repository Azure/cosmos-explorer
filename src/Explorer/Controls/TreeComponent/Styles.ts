import { makeStyles, tokens, treeItemLevelToken } from "@fluentui/react-components";
import { cosmosShorthands } from "Explorer/Theme/ThemeUtil";

export type TreeStyleName = keyof ReturnType<typeof useTreeStyles>;

const treeIconWidth = "--cosmos-Tree--iconWidth" as const;

export const useTreeStyles = makeStyles({
  tree: {
    rowGap: "0px",
    paddingTop: "0px",
    [treeIconWidth]: "20px",
  },
  nodeIcon: {
    width: `var(${treeIconWidth})`,
    height: `var(${treeIconWidth})`,
  },
  treeItemLayout: {
    minHeight: '36px',
    ...cosmosShorthands.borderBottom(),

    paddingLeft: `calc(var(${treeItemLevelToken}, 1) * ${tokens.spacingHorizontalXXL})`,
  },
  treeItemLayoutNoIcon: {
    // Pad the text out by the level, the width of the icon, AND the usual spacing between the icon and the level.
    // It would be nice to see if we can use Grid layout or something here, but that would require overriding a lot of the existing Tree component behavior.
    paddingLeft: `calc((var(${treeItemLevelToken}, 1) * ${tokens.spacingHorizontalXXL}) + var(${treeIconWidth}) + var(${tokens.spacingHorizontalXXS}))`,
  },
  selectedItem: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
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