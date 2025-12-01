import { makeStyles, shorthands, treeItemLevelToken } from "@fluentui/react-components";
import { cosmosShorthands, tokens } from "Explorer/Theme/ThemeUtil";

export type TreeStyleName = keyof ReturnType<typeof useTreeStyles>;

const treeIconWidth = "--cosmos-Tree--iconWidth" as const;
const leafNodeSpacing = "--cosmos-Tree--leafNodeSpacing" as const;
const actionButtonBackground = "--cosmos-Tree--actionButtonBackground" as const;

export const useTreeStyles = makeStyles({
  treeContainer: {
    height: "100%",
    maxHeight: "100vh",
    ...shorthands.overflow("auto"),
  },
  tree: {
    width: "fit-content",
    minWidth: "100%",
    rowGap: "0px",
    paddingTop: "0px",
    [treeIconWidth]: "16px",
    [leafNodeSpacing]: "24px",
  },
  nodeIcon: {
    width: `var(${treeIconWidth})`,
    height: `var(${treeIconWidth})`,
  },
  treeItem: {},
  nodeLabel: {
    whiteSpace: "nowrap", // Don't wrap text, there will be a scrollbar.
  },
  treeItemLayout: {
    fontSize: tokens.fontSizeBase300,
    height: tokens.layoutRowHeight,
    ...cosmosShorthands.borderBottom(),

    // Some sneaky CSS variables stuff to change the background color of the action button on hover.
    [actionButtonBackground]: tokens.colorNeutralBackground1,
    "&:hover": {
      [actionButtonBackground]: tokens.colorNeutralBackground1Hover,
    },
  },
  actionsButtonContainer: {
    position: "sticky",
    right: 0,
  },
  actionsButton: {
    backgroundColor: `var(${actionButtonBackground})`,
  },
  treeItemLayoutNoIcon: {
    // Pad the text out by the level, the width of the icon, AND the usual spacing between the icon and the level.
    // It would be nice to see if we can use Grid layout or something here, but that would require overriding a lot of the existing Tree component behavior.
    paddingLeft: `calc((var(${treeItemLevelToken}, 1) * ${tokens.spacingHorizontalXXL}) + var(${leafNodeSpacing}))`,
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
