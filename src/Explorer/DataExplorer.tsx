import { makeStyles } from "@fluentui/react-components";
import React from "react";
import type { Explorer } from "../Contracts/ViewModels";
import { useTheme } from "../hooks/useTheme";

interface DataExplorerProps {
  dataExplorer: Explorer;
}

const useStyles = makeStyles({
  root: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
    height: "100%",
    width: "100%"
  }
});

export const DataExplorer: React.FC<DataExplorerProps> = ({ dataExplorer }) => {
  const { isDarkMode } = useTheme();
  const styles = useStyles();


  return (
    <div className={`dataExplorerContainer ${styles.root}`}>
      <div>Data Explorer Content</div>
    </div>
  );
};
