import { Menu, MenuButtonProps, MenuItem, MenuList, MenuPopover, MenuTrigger, SplitButton, makeStyles, shorthands } from "@fluentui/react-components";
import { Add16Regular, ChevronLeft12Regular, ChevronRight12Regular } from "@fluentui/react-icons";
import Explorer from "Explorer/Explorer";
import { CosmosFluentProvider, cosmosShorthands, layoutRowHeightToken } from "Explorer/Theme/ThemeUtil";
import { ResourceTree } from "Explorer/Tree/ResourceTree";
import React, { useCallback, useMemo } from "react";

const useSidebarStyles = makeStyles({
  sidebar: {
    ...cosmosShorthands.borderRight(),
  },
  expanded: {
    display: "grid",
    height: "100%",
    gridTemplateRows: `calc(var(${layoutRowHeightToken}) * 2) 1fr`,
    minWidth: "300px",
  },
  floatingControlsContainer: {
    position: "relative",
    zIndex: 1000,
    width: "100%",
  },
  floatingControls: {
    position: "absolute",
    right: 0,
  },
  expandCollapseButton: {
    ...shorthands.border("none"),
    backgroundColor: "transparent",
  },
  globalCommandsContainer: {
    display: "grid",
    alignItems: "center",
    justifyItems: "center",
    width: "100%",
    ...cosmosShorthands.borderBottom(),
  },
});

interface SidebarProps {
  explorer: Explorer
}

const GlobalCommands: React.FC = () => {
  const styles = useSidebarStyles();
  const actions = useMemo(() => {
    // TODO: Conditional on API type, etc.
    return [
      {
        id: "new_container",
        label: "New container",
        icon: <Add16Regular />,
        onClick: () => alert("New Container")
      },
      {
        id: "new_database",
        label: "New database",
        icon: <Add16Regular />,
        onClick: () => alert("New Database")
      }
    ]
  }, []);

  const primaryAction = useMemo(() => actions.length > 0 ? actions[0] : undefined, [actions]);
  const onPrimaryActionClick = useCallback(() => primaryAction?.onClick(), [primaryAction]);

  if (!primaryAction) {
    return null;
  }

  return <div className={styles.globalCommandsContainer}>
    <Menu positioning="below-end">
      <MenuTrigger disableButtonEnhancement>
        {(triggerProps: MenuButtonProps) => (
          <SplitButton
            menuButton={triggerProps}
            primaryActionButton={{ onClick: onPrimaryActionClick }}
            icon={primaryAction.icon}
          >
            {primaryAction.label}
          </SplitButton>
        )}
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {actions.map((action) => (
            <MenuItem key={action.id} icon={action.icon} onClick={action.onClick}>{action.label}</MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  </div>;
};

export const Sidebar: React.FC<SidebarProps> = ({ explorer }) => {
  const styles = useSidebarStyles();
  const [expanded, setExpanded] = React.useState(true);

  return <CosmosFluentProvider className={styles.sidebar}>
    {expanded
      ? <>
        <div className={styles.floatingControlsContainer}>
          <div className={styles.floatingControls}>
            <button type="button" className={styles.expandCollapseButton} title="Collapse sidebar" onClick={() => setExpanded(false)}><ChevronLeft12Regular /></button>
          </div>
        </div>
        <div className={styles.expanded}>
          <GlobalCommands />
          <ResourceTree explorer={explorer} />
        </div>
      </>
      : <button type="button" className={styles.expandCollapseButton} title="Expand sidebar" onClick={() => setExpanded(true)}><ChevronRight12Regular /></button>}
  </CosmosFluentProvider>;
};