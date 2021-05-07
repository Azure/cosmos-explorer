import {
  Dropdown,
  ICommandBarItemProps,
  IComponentAsProps,
  IconType,
  IDropdownOption,
  IDropdownStyles,
} from "@fluentui/react";
import { Observable } from "knockout";
import * as React from "react";
import _ from "underscore";
import ChevronDownIcon from "../../../../images/Chevron_down.svg";
import { StyleConstants } from "../../../Common/Constants";
import { MemoryUsageInfo } from "../../../Contracts/DataModels";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { ArcadiaMenuPicker } from "../../Controls/Arcadia/ArcadiaMenuPicker";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import { MemoryTrackerComponent } from "./MemoryTrackerComponent";

/**
 * Convert our NavbarButtonConfig to UI Fabric buttons
 * @param btns
 */
export const convertButton = (btns: CommandButtonComponentProps[], backgroundColor: string): ICommandBarItemProps[] => {
  const buttonHeightPx = StyleConstants.CommandBarButtonHeight;

  return btns
    .filter((btn) => btn)
    .map(
      (btn: CommandButtonComponentProps, index: number): ICommandBarItemProps => {
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
            },
            imageProps: btn.iconSrc ? { src: btn.iconSrc, alt: btn.iconAlt } : undefined,
            iconName: btn.iconName,
          },
          onClick: (ev?: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>) => {
            btn.onCommandClick(ev);
            TelemetryProcessor.trace(Action.ClickCommandBarButton, ActionModifiers.Mark, { label });
          },
          key: `${btn.commandButtonLabel}${index}`,
          text: label,
          "data-test": label,
          title: btn.tooltipText,
          name: label,
          disabled: btn.disabled,
          ariaLabel: btn.ariaLabel,
          buttonStyles: {
            root: {
              backgroundColor: backgroundColor,
              height: buttonHeightPx,
              paddingRight: 0,
              paddingLeft: 0,
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
                ":hover": { backgroundColor: StyleConstants.AccentLight },
              },
              width: 16,
            },
            label: { fontSize: StyleConstants.mediumFontSize },
            rootHovered: { backgroundColor: StyleConstants.AccentLight },
            rootPressed: { backgroundColor: StyleConstants.AccentLight },
            splitButtonMenuButtonExpanded: {
              backgroundColor: StyleConstants.AccentExtra,
              selectors: {
                ":hover": { backgroundColor: StyleConstants.AccentLight },
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
                  ".ms-ContextualMenu-itemText": { fontSize: StyleConstants.mediumFontSize },
                  ".ms-ContextualMenu-link:hover": { backgroundColor: StyleConstants.AccentLight },
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
            },
            imageProps: { src: ChevronDownIcon, alt: btn.iconAlt },
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
            index?: number
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

        if (btn.isArcadiaPicker && btn.arcadiaProps) {
          result.commandBarButtonAs = () => <ArcadiaMenuPicker {...btn.arcadiaProps} />;
        }

        return result;
      }
    );
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

export const createMemoryTracker = (
  key: string,
  memoryUsageInfo: Observable<MemoryUsageInfo>
): ICommandBarItemProps => {
  return {
    key,
    onRender: () => <MemoryTrackerComponent memoryUsageInfo={memoryUsageInfo} />,
  };
};
