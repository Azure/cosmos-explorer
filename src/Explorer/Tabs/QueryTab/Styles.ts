import { makeStyles, shorthands } from "@fluentui/react-components";
import { cosmosShorthands } from "Explorer/Theme/ThemeUtil";

export type QueryTabStyles = ReturnType<typeof useQueryTabStyles>;
export const useQueryTabStyles = makeStyles({
  queryTab: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  queryEditor: {
    ...shorthands.border("none"),
    paddingTop: "4px",
    height: "100%",
    width: "100%",
  },
  executeCallToAction: {
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  queryResultsPanel: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    "@media (max-width: 420px)": {
      overflow: "scroll",
    },
  },
  queryResultsMessage: {
    ...shorthands.margin("5px"),
  },
  queryResultsBody: {
    flexGrow: 1,
    justifySelf: "stretch",
  },
  queryResultsTabPanel: {
    height: "100%",
    display: "flex",
    rowGap: "12px",
    flexDirection: "column",
    "@media (max-width: 420px)": {
      height: "auto",
    },
  },
  queryResultsTabContentContainer: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    paddingLeft: "12px",
    paddingRight: "12px",
    overflow: "auto",
  },
  queryResultsViewer: {
    flexGrow: 1,
  },
  queryResultsBar: {
    display: "flex",
    flexDirection: "row",
    columnGap: "4px",
    paddingBottom: "4px",
  },
  flexGrowSpacer: {
    flexGrow: 1,
  },
  queryStatsGrid: {
    flexGrow: 1,
    overflow: "auto",
  },
  metricsGridContainer: {
    display: "flex",
    flexDirection: "column",
    paddingBottom: "6px",
    maxHeight: "100%",
  },
  metricsGridButtons: {
    ...cosmosShorthands.borderTop(),
  },
  errorListTableCell: {
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  errorListMessageCell: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
  },
  errorListMessage: {
    flexGrow: 1,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  errorListMessageActions: {
    display: "flex",
    flexDirection: "row",
  },
  responsiveImg: {
    "@media (max-width: 420px)": {
      width: "50px",
    },
  },
  zoomedImageSize: {
    width: "60px",
  },
});
