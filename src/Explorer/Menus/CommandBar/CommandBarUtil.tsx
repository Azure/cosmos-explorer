import {
  Dropdown,
  ICommandBarItemProps,
  IComponentAsProps,
  IconType,
  IDropdownOption,
  IDropdownStyles,
} from "@fluentui/react";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { KeyboardHandlerMap } from "KeyboardShortcuts";
import * as React from "react";
import _ from "underscore";
import ChevronDownIcon from "../../../../images/Chevron_down.svg";
import { PoolIdType } from "../../../Common/Constants";
import { StyleConstants } from "../../../Common/StyleConstants";
import { configContext, Platform } from "../../../ConfigContext";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import { ConnectionStatus } from "./ConnectionStatusComponent";
import { MemoryTracker } from "./MemoryTrackerComponent";

/**
 * Convert our NavbarButtonConfig to UI Fabric buttons
 * @param btns
 */
export const convertButton = (btns: CommandButtonComponentProps[], backgroundColor: string): ICommandBarItemProps[] => {
  const buttonHeightPx =
    configContext.platform == Platform.Fabric
      ? StyleConstants.FabricCommandBarButtonHeight
      : StyleConstants.CommandBarButtonHeight;

  const hoverColor =
    configContext.platform == Platform.Fabric ? StyleConstants.FabricAccentLight : StyleConstants.AccentLight;

  const getFilter = (isDisabled: boolean): string => {
    if (isDisabled) {
      return StyleConstants.GrayScale;
    }
    return configContext.platform == Platform.Fabric ? StyleConstants.FabricToolbarIconColor : undefined;
  };

  return btns
    .filter((btn) => btn)
    .map((btn: CommandButtonComponentProps, index: number): ICommandBarItemProps => {
      if (btn.isDivider) {
        return createDivider(btn.commandButtonLabel);
      }

      const isSplit = !!btn.children && btn.children.length > 0;
      const label = btn.commandButtonLabel || btn.tooltipText;
      const result: ICommandBarItemProps = {
        iconProps: {
          style: {
            width: StyleConstants.CommandBarIconWidth, // 16
            alignSelf: btn.iconName ? "baseline" : undefined,
            filter: getFilter(btn.disabled),
          },
          imageProps: btn.iconSrc ? { src: btn.iconSrc, alt: btn.iconAlt } : undefined,
          iconName: btn.iconName,
        },
        onClick: btn.onCommandClick
          ? (ev?: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>) => {
              btn.onCommandClick(ev);
              let copilotEnabled = false;
              if (useQueryCopilot.getState().copilotEnabled && useQueryCopilot.getState().copilotUserDBEnabled) {
                copilotEnabled = useQueryCopilot.getState().copilotEnabledforExecution;
              }
              TelemetryProcessor.trace(Action.ClickCommandBarButton, ActionModifiers.Mark, { label, copilotEnabled });
            }
          : undefined,
        key: `${btn.commandButtonLabel}${index}`,
        text: label,
        title: btn.tooltipText,
        name: label,
        disabled: btn.disabled,
        ariaLabel: btn.ariaLabel,
        "data-testid": `CommandBar/Button:${label}`,
        buttonStyles: {
          root: {
            backgroundColor: backgroundColor,
            height: buttonHeightPx,
            paddingRight: 0,
            paddingLeft: 0,
            borderRadius: configContext.platform == Platform.Fabric ? StyleConstants.FabricButtonBorderRadius : "0px",
            minWidth: 24,
            marginLeft: isSplit ? 0 : 5,
            marginRight: isSplit ? 0 : 5,
          },
          rootDisabled: {
            backgroundColor: backgroundColor,
            pointerEvents: "auto",
          },
          splitButtonMenuButton: {
            backgroundColor: backgroundColor,
            selectors: {
              ":hover": { backgroundColor: hoverColor },
            },
            width: 16,
          },
          label: {
            fontSize:
              configContext.platform == Platform.Fabric
                ? StyleConstants.DefaultFontSize
                : StyleConstants.mediumFontSize,
          },
          rootHovered: { backgroundColor: hoverColor },
          rootPressed: { backgroundColor: hoverColor },
          splitButtonMenuButtonExpanded: {
            backgroundColor: StyleConstants.AccentExtra,
            selectors: {
              ":hover": { backgroundColor: hoverColor },
            },
          },
          splitButtonDivider: {
            display: "none",
          },
          icon: {
            paddingLeft: 0,
            paddingRight: 0,
          },
          splitButtonContainer: {
            marginLeft: 5,
            marginRight: 5,
            height: buttonHeightPx,
          },
        },
        className: btn.className,
        id: btn.id,
      };

      if (isSplit) {
        // It's a split button
        result.split = true;

        result.subMenuProps = {
          items: convertButton(btn.children, backgroundColor),
          styles: {
            list: {
              // TODO Figure out how to do it the proper way with subComponentStyles.
              // TODO Remove all this crazy styling once we adopt Ui-Fabric Azure themes
              selectors: {
                ".ms-ContextualMenu-itemText": {
                  fontSize:
                    configContext.platform == Platform.Fabric
                      ? StyleConstants.DefaultFontSize
                      : StyleConstants.mediumFontSize,
                },
                ".ms-ContextualMenu-link:hover": { backgroundColor: hoverColor },
                ".ms-ContextualMenu-icon": { width: 16, height: 16 },
              },
            },
          },
        };

        result.menuIconProps = {
          iconType: IconType.image,
          style: {
            width: 12,
            paddingLeft: 1,
            paddingTop: 6,
            filter: getFilter(btn.disabled),
          },
          imageProps: {
            src: ChevronDownIcon,
            alt: btn.iconAlt,
          },
        };
      }

      if (btn.isDropdown) {
        const selectedChild = _.find(btn.children, (child) => child.dropdownItemKey === btn.dropdownSelectedKey);
        result.name = selectedChild?.commandButtonLabel || btn.dropdownPlaceholder;

        const dropdownStyles: Partial<IDropdownStyles> = {
          root: { margin: 5 },
          dropdown: { width: btn.dropdownWidth },
          title: { fontSize: 12, height: 30, lineHeight: 28 },
          dropdownItem: { fontSize: 12, lineHeight: 28, minHeight: 30 },
          dropdownItemSelected: { fontSize: 12, lineHeight: 28, minHeight: 30 },
        };

        const onDropdownChange = (
          event: React.FormEvent<HTMLDivElement>,
          option?: IDropdownOption,
          index?: number,
        ): void => {
          btn.children[index].onCommandClick(event);
          TelemetryProcessor.trace(Action.ClickCommandBarButton, ActionModifiers.Mark, { label: option.text });
        };

        result.commandBarButtonAs = (props: IComponentAsProps<ICommandBarItemProps>) => {
          return (
            <Dropdown
              placeholder={btn.dropdownPlaceholder}
              defaultSelectedKey={btn.dropdownSelectedKey}
              onChange={onDropdownChange}
              options={btn.children.map((child: CommandButtonComponentProps) => ({
                key: child.dropdownItemKey,
                text: child.commandButtonLabel,
              }))}
              styles={dropdownStyles}
            />
          );
        };
      }

      return result;
    });
};

export const createDivider = (key: string): ICommandBarItemProps => {
  return {
    onRender: () => (
      <div className="dividerContainer">
        <span />
      </div>
    ),
    iconOnly: true,
    disabled: true,
    key: key,
  };
};

export const createMemoryTracker = (key: string): ICommandBarItemProps => {
  return {
    key,
    onRender: () => <MemoryTracker />,
  };
};

export const createConnectionStatus = (container: Explorer, poolId: PoolIdType, key: string): ICommandBarItemProps => {
  return {
    key,
    onRender: () => <ConnectionStatus container={container} poolId={poolId} />,
  };
};

export function createKeyboardHandlers(allButtons: CommandButtonComponentProps[]): KeyboardHandlerMap {
  const handlers: KeyboardHandlerMap = {};

  function createHandlers(buttons: CommandButtonComponentProps[]) {
    buttons.forEach((button) => {
      if (!button.disabled && button.keyboardAction) {
        handlers[button.keyboardAction] = (e) => {
          button.onCommandClick(e);

          // If the handler is bound, it means the button is visible and enabled, so we should prevent the default action
          return true;
        };
      }

      if (button.children && button.children.length > 0) {
        createHandlers(button.children);
      }
    });
  }

  createHandlers(allButtons);

  return handlers;
}
