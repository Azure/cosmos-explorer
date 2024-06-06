import { Button, Menu, MenuButtonProps, MenuItem, MenuList, MenuPopover, MenuTrigger, SplitButton, makeStyles, shorthands } from "@fluentui/react-components";
import { Add16Regular, ChevronLeft12Regular, ChevronRight12Regular } from "@fluentui/react-icons";
import { Platform, configContext } from "ConfigContext";
import Explorer from "Explorer/Explorer";
import { AddDatabasePanel } from "Explorer/Panes/AddDatabasePanel/AddDatabasePanel";
import { CosmosFluentProvider, cosmosShorthands, layoutRowHeightToken } from "Explorer/Theme/ThemeUtil";
import { ResourceTree } from "Explorer/Tree/ResourceTree";
import { useDatabases } from "Explorer/useDatabases";
import { KeyboardAction, KeyboardActionGroup, KeyboardActionHandler, useKeyboardActionGroup } from "KeyboardShortcuts";
import { userContext } from "UserContext";
import { getCollectionName, getDatabaseName } from "Utils/APITypeUtils";
import { useSidePanel } from "hooks/useSidePanel";
import React, { useCallback, useEffect, useMemo } from "react";

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

interface GlobalCommandsProps {
  explorer: Explorer
}

interface GlobalCommand {
  id: string;
  label: string;
  icon: JSX.Element;
  onClick: () => void;
  keyboardAction?: KeyboardAction;
}

const GlobalCommands: React.FC<GlobalCommandsProps> = ({ explorer }) => {
  const styles = useSidebarStyles();
  const actions = useMemo<GlobalCommand[]>(() => {
    if (configContext.platform === Platform.Fabric ||
      userContext.apiType === "Postgres" ||
      userContext.apiType === "VCoreMongo") {
      // No Global Commands for these API types.
      // In fact, no sidebar for Postgres or VCoreMongo at all, but just in case, we check here anyway.
      return [];
    }

    const actions: GlobalCommand[] = [
      {
        id: "new_collection",
        label: `New ${getCollectionName()}`,
        icon: <Add16Regular />,
        onClick: () => explorer.onNewCollectionClicked(),
        keyboardAction: KeyboardAction.NEW_COLLECTION,
      }
    ];
  
    if(userContext.apiType !== "Tables") {
      actions.push({
        id: "new_database",
        label: `New ${getDatabaseName()}`,
        icon: <Add16Regular />,
        onClick: async () => {
          const throughputCap = userContext.databaseAccount?.properties.capacity?.totalThroughputLimit;
          if (throughputCap && throughputCap !== -1) {
            await useDatabases.getState().loadAllOffers();
          }
          useSidePanel.getState().openSidePanel("New " + getDatabaseName(), <AddDatabasePanel explorer={explorer} />);
        },
        keyboardAction: KeyboardAction.NEW_DATABASE,
      });
    }

    return actions;
  }, [explorer]);

  const primaryAction = useMemo(() => actions.length > 0 ? actions[0] : undefined, [actions]);
  const onPrimaryActionClick = useCallback(() => primaryAction?.onClick(), [primaryAction]);
  const setKeyboardActions = useKeyboardActionGroup(KeyboardActionGroup.GLOBAL_COMMANDS);

  useEffect(() => {
    setKeyboardActions(actions.reduce((acc, action) => {
      if (action.keyboardAction) {
        acc[action.keyboardAction] = action.onClick;
      }
      return acc;
    }, {} as Record<KeyboardAction, KeyboardActionHandler>));
  }, [actions, setKeyboardActions]);

  if (!primaryAction) {
    return null;
  }

  return <div className={styles.globalCommandsContainer}>
    {actions.length === 1
      ? <Button icon={primaryAction.icon} onClick={onPrimaryActionClick}>
        {primaryAction.label}
      </Button>
      : <Menu positioning="below-end">
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
      </Menu>}
  </div>;
};

interface SidebarProps {
  explorer: Explorer
}

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
          <GlobalCommands explorer={explorer} />
          <ResourceTree explorer={explorer} />
        </div>
      </>
      : <button type="button" className={styles.expandCollapseButton} title="Expand sidebar" onClick={() => setExpanded(true)}><ChevronRight12Regular /></button>}
  </CosmosFluentProvider>;
};