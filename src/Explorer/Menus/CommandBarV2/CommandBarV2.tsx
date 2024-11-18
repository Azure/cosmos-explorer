import {
  makeStyles,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  Tooltip,
} from "@fluentui/react-components";
import { CommandButtonComponentProps } from "Explorer/Controls/CommandButton/CommandButtonComponent";
import Explorer from "Explorer/Explorer";
import {
  createPlatformButtons,
  createStaticCommandBarButtons,
} from "Explorer/Menus/CommandBar/CommandBarComponentButtonFactory";
import { createKeyboardHandlers } from "Explorer/Menus/CommandBar/CommandBarUtil";
import { useCommandBar } from "Explorer/Menus/CommandBar/useCommandBar";
import { CosmosFluentProvider, cosmosShorthands, tokens } from "Explorer/Theme/ThemeUtil";
import { useSelectedNode } from "Explorer/useSelectedNode";
import { KeyboardActionGroup, useKeyboardActionGroup } from "KeyboardShortcuts";
import React, { MouseEventHandler } from "react";

const useToolbarStyles = makeStyles({
  toolbar: {
    height: tokens.layoutRowHeight,
    justifyContent: "space-between", // Ensures that the two toolbar groups are at opposite ends of the toolbar
    ...cosmosShorthands.borderBottom(),
  },
  toolbarGroup: {
    display: "flex",
  },
});

export interface CommandBarV2Props {
  explorer: Explorer;
}

export const CommandBarV2: React.FC<CommandBarV2Props> = ({ explorer }: CommandBarV2Props) => {
  const styles = useToolbarStyles();
  const selectedNodeState = useSelectedNode();
  const contextButtons = useCommandBar((state) => state.contextButtons);
  const isHidden = useCommandBar((state) => state.isHidden);
  const setKeyboardHandlers = useKeyboardActionGroup(KeyboardActionGroup.COMMAND_BAR);
  const staticButtons = createStaticCommandBarButtons(selectedNodeState);
  const platformButtons = createPlatformButtons();

  if (isHidden) {
    setKeyboardHandlers({});
    return null;
  }

  const allButtons = staticButtons.concat(contextButtons).concat(platformButtons);
  const keyboardHandlers = createKeyboardHandlers(allButtons, explorer);
  setKeyboardHandlers(keyboardHandlers);

  return (
    <CosmosFluentProvider>
      <Toolbar className={styles.toolbar}>
        <ToolbarGroup role="presentation" className={styles.toolbarGroup}>
          {staticButtons.map((button, index) =>
            renderButton(explorer, button, `static-${index}`, contextButtons?.length > 0),
          )}
          {staticButtons.length > 0 && contextButtons?.length > 0 && <ToolbarDivider />}
          {contextButtons.map((button, index) => renderButton(explorer, button, `context-${index}`, false))}
        </ToolbarGroup>
        <ToolbarGroup role="presentation">
          {platformButtons.map((button, index) => renderButton(explorer, button, `platform-${index}`, true))}
        </ToolbarGroup>
      </Toolbar>
    </CosmosFluentProvider>
  );
};

// This allows us to migrate individual buttons over to using a JSX.Element for the icon, without requiring us to change them all at once.
function renderIcon(iconSrcOrElement: string | JSX.Element, alt?: string): JSX.Element {
  if (typeof iconSrcOrElement === "string") {
    return <img src={iconSrcOrElement} alt={alt} />;
  }
  return iconSrcOrElement;
}

function renderButton(
  explorer: Explorer,
  btn: CommandButtonComponentProps,
  key: string,
  iconOnly: boolean,
): JSX.Element {
  if (btn.isDivider) {
    return <ToolbarDivider key={key} />;
  }

  const hasChildren = !!btn.children && btn.children.length > 0;
  const label = btn.commandButtonLabel || btn.tooltipText;
  const tooltip = btn.tooltipText || (iconOnly ? label : undefined);
  const onClick: MouseEventHandler | undefined =
    btn.onCommandClick && !hasChildren ? (e) => btn.onCommandClick(e, explorer) : undefined;

  // We don't know which element will be the top-level element, so just slap a key on all of 'em

  let button = hasChildren ? (
    <MenuButton key={key} appearance="subtle" aria-label={btn.ariaLabel} icon={renderIcon(btn.iconSrc, btn.iconAlt)}>
      {!iconOnly && label}
    </MenuButton>
  ) : (
    <ToolbarButton key={key} aria-label={btn.ariaLabel} onClick={onClick} icon={renderIcon(btn.iconSrc, btn.iconAlt)}>
      {!iconOnly && label}
    </ToolbarButton>
  );

  if (tooltip) {
    button = (
      <Tooltip key={key} content={tooltip} relationship="description" withArrow>
        {button}
      </Tooltip>
    );
  }

  if (hasChildren) {
    button = (
      <Menu key={key}>
        <MenuTrigger disableButtonEnhancement>{button}</MenuTrigger>
        <MenuPopover>
          <MenuList>{btn.children.map((child, index) => renderMenuItem(explorer, child, index.toString()))}</MenuList>
        </MenuPopover>
      </Menu>
    );
  }

  return button;
}

function renderMenuItem(explorer: Explorer, btn: CommandButtonComponentProps, key: string): JSX.Element {
  const hasChildren = !!btn.children && btn.children.length > 0;
  const onClick: MouseEventHandler | undefined = btn.onCommandClick
    ? (e) => btn.onCommandClick(e, explorer)
    : undefined;
  const item = (
    <MenuItem key={key} onClick={onClick} icon={renderIcon(btn.iconSrc, btn.iconAlt)}>
      {btn.commandButtonLabel || btn.tooltipText}
    </MenuItem>
  );

  if (hasChildren) {
    return (
      <Menu>
        <MenuTrigger disableButtonEnhancement>{item}</MenuTrigger>
        <MenuPopover>
          <MenuList>{btn.children.map((child, index) => renderMenuItem(explorer, child, index.toString()))}</MenuList>
        </MenuPopover>
      </Menu>
    );
  }
  return item;
}
