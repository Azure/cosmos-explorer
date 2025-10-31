import {
  Button,
  makeStyles,
  Menu,
  MenuButton,
  MenuButtonProps,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  mergeClasses,
  shorthands,
  SplitButton,
} from "@fluentui/react-components";
import { Add16Regular, ArrowSync12Regular, ChevronLeft12Regular, ChevronRight12Regular } from "@fluentui/react-icons";
import { GlobalSecondaryIndexLabels } from "Common/Constants";
import { isGlobalSecondaryIndexEnabled } from "Common/DatabaseAccountUtility";
import { configContext, Platform } from "ConfigContext";
import Explorer from "Explorer/Explorer";
import { AddDatabasePanel } from "Explorer/Panes/AddDatabasePanel/AddDatabasePanel";
import {
  AddGlobalSecondaryIndexPanel,
  AddGlobalSecondaryIndexPanelProps,
} from "Explorer/Panes/AddGlobalSecondaryIndexPanel/AddGlobalSecondaryIndexPanel";
import { Tabs } from "Explorer/Tabs/Tabs";
import { CosmosFluentProvider, cosmosShorthands, tokens } from "Explorer/Theme/ThemeUtil";
import { useDatabases } from "Explorer/useDatabases";
import { KeyboardAction, KeyboardActionGroup, KeyboardActionHandler, useKeyboardActionGroup } from "KeyboardShortcuts";
import { isFabric, isFabricMirrored, isFabricNative, isFabricNativeReadOnly } from "Platform/Fabric/FabricUtil";
import { userContext } from "UserContext";
import { getCollectionName, getDatabaseName } from "Utils/APITypeUtils";
import { conditionalClass } from "Utils/StyleUtils";
import { Allotment, AllotmentHandle } from "allotment";
import { useSidePanel } from "hooks/useSidePanel";
import { useTheme } from "hooks/useTheme";
import useZoomLevel from "hooks/useZoomLevel";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ResourceTree } from "./Tree/ResourceTree";

const useSidebarStyles = makeStyles({
  sidebar: {
    height: "100%",
  },
  sidebarContainer: {
    height: "100%",
    width: "100%",
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    transition: "all 0.2s ease-in-out",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
    position: "relative",
  },
  expandedContent: {
    display: "grid",
    height: "100%",
    width: "100%",
    gridTemplateRows: `calc(${tokens.layoutRowHeight} * 2) 1fr`,
  },
  floatingControlsContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 1000,
    width: "auto",
    padding: tokens.spacingHorizontalS,
  },
  floatingControls: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingHorizontalXS,
  },
  floatingControlButton: {
    ...shorthands.border("none"),
    backgroundColor: "transparent",
    color: tokens.colorNeutralForeground1,
    cursor: "pointer",
    padding: tokens.spacingHorizontalXS,
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
    },
    ":active": {
      backgroundColor: tokens.colorNeutralBackground1Pressed,
      color: tokens.colorNeutralForeground1,
    },
    ":disabled": {
      color: tokens.colorNeutralForegroundDisabled,
      cursor: "not-allowed",
    },
  },
  globalCommandsContainer: {
    display: "grid",
    alignItems: "center",
    justifyItems: "center",
    width: "100%",
    containerType: "size", // Use this container for "@container" queries below this.
    padding: tokens.spacingHorizontalS,
    ...cosmosShorthands.borderBottom(),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  loadingProgressBar: {
    // Float above the content
    position: "absolute",
    width: "100%",
    height: "2px",
    zIndex: 2000,
    backgroundColor: tokens.colorCompoundBrandBackground,
    animationIterationCount: "infinite",
    animationDuration: "3s",
    animationName: {
      "0%": {
        opacity: ".2",
      },
      "50%": {
        opacity: "1",
      },
      "100%": {
        opacity: ".2",
      },
    },
  },
  globalCommandsMenuButton: {
    display: "inline-flex",
    "@container (min-width: 250px)": {
      display: "none",
    },
  },
  globalCommandsSplitButton: {
    display: "none",
    "@container (min-width: 250px)": {
      display: "flex",
    },
  },
  accessibleContent: {
    "@media (max-width: 420px)": {
      overflow: "scroll",
    },
  },
  minHeightResponsive: {
    "@media (max-width: 420px)": {
      minHeight: "400px",
    },
  },
  accessibleContentZoom: {
    overflow: "scroll",
  },

  minHeightZoom: {
    minHeight: "400px",
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
  ref?: React.RefObject<HTMLButtonElement>;
}

const GlobalCommands: React.FC<GlobalCommandsProps> = ({ explorer }) => {
  const styles = useSidebarStyles();

  // Since we have two buttons in the DOM (one for small screens and one for larger screens), we wrap the entire thing in a div.
  // However, that messes with the Menu positioning, so we need to get a reference to the 'div' to pass to the Menu.
  // We can't use a ref though, because it would be set after the Menu is rendered, so we use a state value to force a re-render.
  const [globalCommandButton, setGlobalCommandButton] = useState<HTMLElement | null>(null);
  const primaryFocusableRef = useRef<HTMLButtonElement>(null);

  const actions = useMemo<GlobalCommand[]>(() => {
    if (
      (isFabric() && userContext.fabricContext?.isReadOnly) ||
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
        onClick: () => {
          const databaseId = isFabricNative() ? userContext.fabricContext?.databaseName : undefined;
          explorer.onNewCollectionClicked({ databaseId });
        },
        keyboardAction: KeyboardAction.NEW_COLLECTION,
      },
    ];

    if (configContext.platform !== Platform.Fabric && userContext.apiType !== "Tables") {
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

    if (isGlobalSecondaryIndexEnabled()) {
      const addMaterializedViewPanelProps: AddGlobalSecondaryIndexPanelProps = {
        explorer,
      };

      actions.push({
        id: "new_materialized_view",
        label: GlobalSecondaryIndexLabels.NewGlobalSecondaryIndex,
        icon: <Add16Regular />,
        onClick: () =>
          useSidePanel
            .getState()
            .openSidePanel(
              GlobalSecondaryIndexLabels.NewGlobalSecondaryIndex,
              <AddGlobalSecondaryIndexPanel {...addMaterializedViewPanelProps} />,
            ),
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

  useLayoutEffect(() => {
    if (primaryFocusableRef.current) {
      const timer = setTimeout(() => {
        primaryFocusableRef.current.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  if (!primaryAction) {
    return null;
  }

  return (
    <div className={styles.globalCommandsContainer} data-test="GlobalCommands">
      {actions.length === 1 ? (
        <Button icon={primaryAction.icon} onClick={onPrimaryActionClick} ref={primaryFocusableRef}>
          {primaryAction.label}
        </Button>
      ) : (
        <Menu positioning={{ target: globalCommandButton, position: "below", align: "end" }}>
          <MenuTrigger disableButtonEnhancement>
            {(triggerProps: MenuButtonProps) => (
              <div ref={setGlobalCommandButton}>
                <SplitButton
                  menuButton={{ ...triggerProps, "aria-label": "More commands" }}
                  primaryActionButton={{ onClick: onPrimaryActionClick, ref: primaryFocusableRef }}
                  className={styles.globalCommandsSplitButton}
                  icon={primaryAction.icon}
                >
                  {primaryAction.label}
                </SplitButton>
                <MenuButton {...triggerProps} icon={primaryAction.icon} className={styles.globalCommandsMenuButton}>
                  New...
                </MenuButton>
              </div>
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

const CollapseThreshold = 140;

export const SidebarContainer: React.FC<SidebarProps> = ({ explorer }) => {
  const styles = useSidebarStyles();
  const [expanded, setExpanded] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [expandedSize, setExpandedSize] = React.useState(300);
  const hasSidebar = userContext.apiType !== "Postgres" && userContext.apiType !== "VCoreMongo";
  const allotment = useRef<AllotmentHandle>(null);
  // isDarkMode is used for styling in other parts of the component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isDarkMode } = useTheme();
  const isZoomed = useZoomLevel();

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
    } else if (!expanded && sizes[0] > CollapseThreshold) {
      expand();
    }
  }, 10);

  const onDragEnd = useCallback(
    (sizes: number[]) => {
      if (expanded) {
        // Remember the last size we had when expanded
        setExpandedSize(sizes[0]);
      } else {
        allotment.current.resize([24, Infinity]);
      }
    },
    [expanded, setExpandedSize],
  );

  const onRefreshClick = useCallback(async () => {
    setLoading(true);
    await explorer.onRefreshResourcesClick();
    setLoading(false);
  }, [setLoading]);

  const hasGlobalCommands = !(
    isFabricMirrored() ||
    isFabricNativeReadOnly() ||
    userContext.apiType === "Postgres" ||
    userContext.apiType === "VCoreMongo"
  );

  return (
    <div className="sidebarContainer">
      <Allotment
        ref={allotment}
        onChange={onChange}
        onDragEnd={onDragEnd}
        className={`resourceTreeAndTabs ${styles.accessibleContent} ${conditionalClass(
          isZoomed,
          styles.accessibleContentZoom,
        )}`}
      >
        {/* Collections Tree - Start */}
        {hasSidebar && (
          // When collapsed, we force the pane to 24 pixels wide and make it non-resizable.
          <Allotment.Pane
            className={`${styles.minHeightResponsive} ${conditionalClass(isZoomed, styles.minHeightZoom)}`}
            minSize={24}
            preferredSize={250}
          >
            <CosmosFluentProvider className={mergeClasses(styles.sidebar)}>
              <div className={styles.sidebarContainer}>
                {loading && (
                  // The Fluent UI progress bar has some issues in reduced-motion environments so we use a simple CSS animation here.
                  // https://github.com/microsoft/fluentui/issues/29076
                  <div className={styles.loadingProgressBar} title="Refreshing tree..." />
                )}
                {expanded ? (
                  <>
                    <div className={styles.floatingControlsContainer}>
                      <div className={styles.floatingControls}>
                        {!isFabricNative() && (
                          <button
                            type="button"
                            data-test="Sidebar/RefreshButton"
                            className={styles.floatingControlButton}
                            disabled={loading}
                            title="Refresh"
                            onClick={onRefreshClick}
                          >
                            <ArrowSync12Regular />
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.floatingControlButton}
                          title="Collapse sidebar"
                          onClick={() => collapse()}
                        >
                          <ChevronLeft12Regular />
                        </button>
                      </div>
                    </div>
                    <div
                      className={styles.expandedContent}
                      style={!hasGlobalCommands ? { gridTemplateRows: "1fr" } : undefined}
                    >
                      {hasGlobalCommands && <GlobalCommands explorer={explorer} />}
                      <ResourceTree explorer={explorer} />
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.floatingControlButton}
                    title="Expand sidebar"
                    onClick={() => expand()}
                  >
                    <ChevronRight12Regular />
                  </button>
                )}
              </div>
            </CosmosFluentProvider>
          </Allotment.Pane>
        )}
        <Allotment.Pane
          className={`${styles.minHeightResponsive} ${conditionalClass(isZoomed, styles.minHeightZoom)}`}
          minSize={200}
        >
          <Tabs explorer={explorer} />
        </Allotment.Pane>
      </Allotment>
    </div>
  );
};
