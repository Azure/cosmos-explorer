import { makeStyles, tokens } from "@fluentui/react-components";
import { cosmosShorthands } from "Explorer/Theme/ThemeUtil";

export type TreeStyleName = keyof ReturnType<typeof useTreeStyles>;

export const useTreeStyles = makeStyles({
  tree: {
    rowGap: "0px",
    paddingTop: "0px",
  },
  treeItemLayout: {
    minHeight: '36px',
    ...cosmosShorthands.borderBottom(),
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