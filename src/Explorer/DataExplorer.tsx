import { makeStyles } from "@fluentui/react-components";
import React from "react";
import type { Explorer } from "../Contracts/ViewModels";

interface DataExplorerProps {
  dataExplorer?: Explorer;
}

const useStyles = makeStyles({
  root: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
    height: "100%",
    width: "100%",
  },
});

export const DataExplorer: React.FC<DataExplorerProps> = () => {
  const styles = useStyles();

  return (
    <div className={`dataExplorerContainer ${styles.root}`}>
      <div>Data Explorer Content</div>
    </div>
  );
};
