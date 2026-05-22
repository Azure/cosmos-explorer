/**
 * This adapter is responsible to render the React component
 * If the component signals a change through the callback passed in the properties, it must render the React component when appropriate
 * and update any knockout observables passed from the parent.
 */
import { CommandBar as FluentCommandBar, ICommandBarItemProps } from "@fluentui/react";
import { makeStyles, useFluent } from "@fluentui/react-components";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { useDataPlaneRbac } from "Explorer/Panes/SettingsPane/SettingsPane";
import { KeyboardActionGroup, useKeyboardActionGroup } from "KeyboardShortcuts";
import { isFabric } from "Platform/Fabric/FabricUtil";
import { userContext } from "UserContext";
import * as React from "react";
import create, { UseStore } from "zustand";
import { ConnectionStatusType, PoolIdType } from "../../../Common/Constants";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import { useSelectedNode } from "../../useSelectedNode";
import * as CommandBarComponentButtonFactory from "./CommandBarComponentButtonFactory";
import * as CommandBarUtil from "./CommandBarUtil";

interface Props {
  container: Explorer;
}

export interface CommandBarStore {
  contextButtons: CommandButtonComponentProps[];
  setContextButtons: (contextButtons: CommandButtonComponentProps[]) => void;
  isHidden: boolean;
  setIsHidden: (isHidden: boolean) => void;
}

export const useCommandBar: UseStore<CommandBarStore> = create((set) => ({
  contextButtons: [] as CommandButtonComponentProps[],
  setContextButtons: (contextButtons: CommandButtonComponentProps[]) => set((state) => ({ ...state, contextButtons })),
  isHidden: false,
  setIsHidden: (isHidden: boolean) => set((state) => ({ ...state, isHidden })),
}));

const useStyles = makeStyles({
  commandBarContainer: {
    borderBottom: "1px solid var(--colorNeutralStroke1)",
    // backgroundColor: "var(--colorNeutralBackground1)",
  },
  toolbarButton: {
    backgroundColor: "transparent",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2)",
    },
    "&:active": {
      backgroundColor: "var(--colorNeutralBackground3)",
    },
  },
  buttonIcon: {
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& img": {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
  },
});

export const CommandBar: React.FC<Props> = ({ container }: Props) => {
  const selectedNodeState = useSelectedNode();
  const buttons = useCommandBar((state) => state.contextButtons);
  const isHidden = useCommandBar((state) => state.isHidden);
  // targetDocument is used by referenced components
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { targetDocument } = useFluent();
  const setKeyboardHandlers = useKeyboardActionGroup(KeyboardActionGroup.COMMAND_BAR);
  const styles = useStyles();

  const { connectionInfo, isPhoenixNotebooks, isPhoenixFeatures } = useNotebook((state) => ({
    connectionInfo: state.connectionInfo,
    isPhoenixNotebooks: state.isPhoenixNotebooks,
    isPhoenixFeatures: state.isPhoenixFeatures,
  }));

  // Subscribe to the store changes that affect button creation
  const dataPlaneRbacEnabled = useDataPlaneRbac((state) => state.dataPlaneRbacEnabled);
  const aadTokenUpdated = useDataPlaneRbac((state) => state.aadTokenUpdated);

  // Memoize the expensive button creation
  const staticButtons = React.useMemo(() => {
    return CommandBarComponentButtonFactory.createStaticCommandBarButtons(container, selectedNodeState);
  }, [container, selectedNodeState, dataPlaneRbacEnabled, aadTokenUpdated]);

  if (userContext.apiType === "Postgres" || userContext.apiType === "VCoreMongo") {
    const buttons =
      userContext.apiType === "Postgres"
        ? CommandBarComponentButtonFactory.createPostgreButtons(container)
        : CommandBarComponentButtonFactory.createVCoreMongoButtons(container);
    return (
      <div className={styles.commandBarContainer} style={{ display: isHidden ? "none" : "initial" }}>
        <FluentCommandBar
          ariaLabel="Use left and right arrow keys to navigate between commands"
          items={CommandBarUtil.convertButton(buttons, "var(--colorNeutralBackground1)")}
          styles={{
            root: {
              backgroundColor: "var(--colorNeutralBackground1)",
              color: "var(--colorNeutralForeground1)",
            },
          }}
          overflowButtonProps={{ ariaLabel: "More commands" }}
        />
      </div>
    );
  }

  const contextButtons = (buttons || []).concat(
    CommandBarComponentButtonFactory.createContextCommandBarButtons(container, selectedNodeState),
  );
  const controlButtons = CommandBarComponentButtonFactory.createControlCommandBarButtons(container);

  const uiFabricStaticButtons = CommandBarUtil.convertButton(staticButtons, "var(--colorNeutralBackground1)");
  if (buttons && buttons.length > 0) {
    uiFabricStaticButtons.forEach((btn: ICommandBarItemProps) => (btn.iconOnly = true));
  }

  const uiFabricTabsButtons: ICommandBarItemProps[] = CommandBarUtil.convertButton(
    contextButtons,
    "var(--colorNeutralBackground1)",
  );

  if (uiFabricTabsButtons.length > 0) {
    uiFabricStaticButtons.push(CommandBarUtil.createDivider("commandBarDivider"));
  }

  const uiFabricControlButtons = CommandBarUtil.convertButton(controlButtons, "var(--colorNeutralBackground1)");
  uiFabricControlButtons.forEach((btn: ICommandBarItemProps) => (btn.iconOnly = true));

  // Add connection status if needed (using the hook values we got at the top level)
  if ((isPhoenixNotebooks || isPhoenixFeatures) && connectionInfo?.status !== ConnectionStatusType.Connect) {
    uiFabricControlButtons.unshift(
      CommandBarUtil.createConnectionStatus(container, PoolIdType.DefaultPoolId, "connectionStatus"),
    );
  }

  const rootStyle = {
    root: {
      backgroundColor: "var(--colorNeutralBackground1)",
      color: "var(--colorNeutralForeground1)",
      padding: isFabric() ? "2px 8px 0px 8px" : undefined,
    },
    button: {
      backgroundColor: "var(--colorNeutralBackground1)",
      color: "var(--colorNeutralForeground1)",
      selectors: {
        ":hover": {
          backgroundColor: "var(--colorNeutralBackground2)",
          color: "var(--colorNeutralForeground1)",
        },
        ":active": {
          backgroundColor: "var(--colorNeutralBackground3)",
          color: "var(--colorNeutralForeground1)",
        },
      },
    },
    menuIcon: {
      color: "var(--colorNeutralForeground1)",
    },
    item: {
      backgroundColor: "var(--colorNeutralBackground1)",
      color: "var(--colorNeutralForeground1)",
    },
    link: {
      backgroundColor: "var(--colorNeutralBackground1)",
      color: "var(--colorNeutralForeground1)",
    },
  };

  const allButtons = staticButtons.concat(contextButtons).concat(controlButtons);
  const keyboardHandlers = CommandBarUtil.createKeyboardHandlers(allButtons);
  setKeyboardHandlers(keyboardHandlers);

  return (
    <div className={styles.commandBarContainer} style={{ display: isHidden ? "none" : "initial" }}>
      <FluentCommandBar
        ariaLabel="Use left and right arrow keys to navigate between commands"
        items={uiFabricStaticButtons.concat(uiFabricTabsButtons)}
        farItems={uiFabricControlButtons}
        styles={rootStyle}
        overflowButtonProps={{ ariaLabel: "More commands" }}
      />
    </div>
  );
};
