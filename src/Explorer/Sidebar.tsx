import { FluentProvider, makeStyles } from "@fluentui/react-components";
import { configContext } from "ConfigContext";
import Explorer from "Explorer/Explorer";
import { cosmosShorthands, getPlatformTheme } from "Explorer/Theme/ThemeUtil";
import { ResourceTree } from "Explorer/Tree/ResourceTree";
import React from "react";

const useSidebarStyles = makeStyles({
  sidebar: {
    minWidth: "250px",
    ...cosmosShorthands.borderRight(),
  }
});

interface SidebarProps {
  explorer: Explorer
}

export const Sidebar: React.FC<SidebarProps> = ({ explorer }) => {
  const styles = useSidebarStyles();

  return <FluentProvider theme={getPlatformTheme(configContext.platform)} className={styles.sidebar}>
    <ResourceTree explorer={explorer} />
  </FluentProvider>;
};