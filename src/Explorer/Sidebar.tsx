import {
  Button,
  Menu,
  MenuButtonProps,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  SplitButton,
  makeStyles,
  mergeClasses,
  shorthands,
} from "@fluentui/react-components";
import { Add16Regular, ChevronLeft12Regular, ChevronRight12Regular } from "@fluentui/react-icons";
import { Platform, configContext } from "ConfigContext";
import Explorer from "Explorer/Explorer";
import { AddDatabasePanel } from "Explorer/Panes/AddDatabasePanel/AddDatabasePanel";
import { Tabs } from "Explorer/Tabs/Tabs";
import { CosmosFluentProvider, cosmosShorthands, tokens } from "Explorer/Theme/ThemeUtil";
import { ResourceTree } from "Explorer/Tree/ResourceTree";
import { useDatabases } from "Explorer/useDatabases";
import { KeyboardAction, KeyboardActionGroup, KeyboardActionHandler, useKeyboardActionGroup } from "KeyboardShortcuts";
import { userContext } from "UserContext";
import { getCollectionName, getDatabaseName } from "Utils/APITypeUtils";
import { Allotment, AllotmentHandle } from "allotment";
import { useSidePanel } from "hooks/useSidePanel";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

const useSidebarStyles = makeStyles({
  sidebar: {
    height: "100%",
    backgroundColor: "transparent",
  },
  sidebarContainer: {
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  expandedContent: {
    display: "grid",
    height: "100%",
    gridTemplateRows: `calc(${tokens.layoutRowHeight} * 2) 1fr`,
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
  explorer: Explorer;
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
    if (
      configContext.platform === Platform.Fabric ||
      userContext.apiType === "Postgres" ||
      userContext.apiType === "VCoreMongo"
    ) {
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
      },
    ];

    if (userContext.apiType !== "Tables") {
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

  const primaryAction = useMemo(() => (actions.length > 0 ? actions[0] : undefined), [actions]);
  const onPrimaryActionClick = useCallback(() => primaryAction?.onClick(), [primaryAction]);
  const setKeyboardActions = useKeyboardActionGroup(KeyboardActionGroup.GLOBAL_COMMANDS);

  useEffect(() => {
    setKeyboardActions(
      actions.reduce(
        (acc, action) => {
          if (action.keyboardAction) {
            acc[action.keyboardAction] = action.onClick;
          }
          return acc;
        },
        {} as Record<KeyboardAction, KeyboardActionHandler>,
      ),
    );
  }, [actions, setKeyboardActions]);

  if (!primaryAction) {
    return null;
  }

  return (
    <div className={styles.globalCommandsContainer}>
      {actions.length === 1 ? (
        <Button icon={primaryAction.icon} onClick={onPrimaryActionClick}>
          {primaryAction.label}
        </Button>
      ) : (
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
                <MenuItem key={action.id} icon={action.icon} onClick={action.onClick}>
                  {action.label}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>
      )}
    </div>
  );
};

interface SidebarProps {
  explorer: Explorer;
}

const CollapseThreshold = 50;

export const SidebarContainer: React.FC<SidebarProps> = ({ explorer }) => {
  const styles = useSidebarStyles();
  const [expanded, setExpanded] = React.useState(true);
  const [expandedSize, setExpandedSize] = React.useState(300);
  const hasSidebar = userContext.apiType !== "Postgres" && userContext.apiType !== "VCoreMongo";
  const allotment = useRef<AllotmentHandle>(null);

  const expand = useCallback(() => {
    if (!expanded) {
      allotment.current.resize([expandedSize, Infinity]);
      setExpanded(true);
    }
  }, [expanded, expandedSize, setExpanded]);

  const collapse = useCallback(() => {
    if (expanded) {
      allotment.current.resize([24, Infinity]);
      setExpanded(false);
    }
  }, [expanded, setExpanded]);

  const onChange = debounce((sizes: number[]) => {
    if (expanded && sizes[0] <= CollapseThreshold) {
      collapse();
    } else if(!expanded && sizes[0] > CollapseThreshold) {
      expand();
    }
  }, 10);

  const onDragEnd = useCallback((sizes: number[]) => {
    if (expanded) {
      // Remember the last size we had when expanded
      setExpandedSize(sizes[0])
    } else {
      allotment.current.resize([24, Infinity]);
    }
  }, [expanded, setExpandedSize]);

  return (
    <Allotment ref={allotment} onChange={onChange} onDragEnd={onDragEnd} className="resourceTreeAndTabs">
      {/* Collections Tree - Start */}
      {hasSidebar && (
        // When collapsed, we force the pane to 24 pixels wide and make it non-resizable.
        <Allotment.Pane minSize={24} preferredSize={300}>
          <CosmosFluentProvider className={mergeClasses(styles.sidebar)}>
            <div className={styles.sidebarContainer}>
              {expanded
                ? <>
                  <div className={styles.floatingControlsContainer}>
                    <div className={styles.floatingControls}>
                      <button
                        type="button"
                        className={styles.expandCollapseButton}
                        title="Collapse sidebar"
                        onClick={() => collapse()}
                      >
                        <ChevronLeft12Regular />
                      </button>
                    </div>
                  </div>
                  <div className={styles.expandedContent}>
                    <GlobalCommands explorer={explorer} />
                    <ResourceTree explorer={explorer} />
                  </div>
                </>
                : <button
                  type="button"
                  className={styles.expandCollapseButton}
                  title="Expand sidebar"
                  onClick={() => expand()}
                >
                  <ChevronRight12Regular />
                </button>}
            </div>
          </CosmosFluentProvider>
        </Allotment.Pane>
      )}
      <Allotment.Pane minSize={800}>
        <Tabs explorer={explorer} />
      </Allotment.Pane>
    </Allotment>
  );
};
