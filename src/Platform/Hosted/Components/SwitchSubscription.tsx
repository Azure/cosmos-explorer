import { Callout, DirectionalHint, Label, SearchBox, mergeStyleSets, useTheme } from "@fluentui/react";
import * as React from "react";
import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Subscription } from "../../../Contracts/DataModels";

interface Props {
  subscriptions: Subscription[];
  selectedSubscription: Subscription;
  setSelectedSubscriptionId: (id: string) => void;
}

export const SwitchSubscription: FunctionComponent<Props> = ({
  subscriptions,
  setSelectedSubscriptionId,
  selectedSubscription,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calloutContentRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { semanticColors, palette } = theme;

  const hoverBackground = semanticColors.menuItemBackgroundHovered || palette.neutralLighterAlt;
  const selectedBackground = semanticColors.menuItemBackgroundChecked || palette.neutralLighter;
  const placeholderColor = semanticColors.bodySubtext || palette.neutralTertiary;

  const classNames = useMemo(
    () =>
      mergeStyleSets({
        container: {
          display: "flex",
          flexDirection: "column",
          gap: 12,
        },
        trigger: {
          width: "100%",
          height: 32,
          padding: "0 28px 0 8px",
          border: `1px solid ${semanticColors.inputBorder || palette.neutralSecondary}`,
          backgroundColor: semanticColors.inputBackground || palette.white,
          color: semanticColors.inputText || semanticColors.bodyText,
          textAlign: "left",
          cursor: "pointer",
          position: "relative",
          fontFamily: "inherit",
          fontSize: 14,
          borderRadius: 2,
          selectors: {
            ":hover": {
              borderColor: semanticColors.inputBorderHovered || palette.neutralPrimary,
            },
            ":focus-visible": {
              outline: `1px solid ${semanticColors.focusBorder || palette.themePrimary}`,
              outlineOffset: 1,
            },
          },
        },
        triggerText: {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "block",
        },
        triggerChevron: {
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        },
        callout: {
          backgroundColor: semanticColors.bodyBackground || palette.white,
        },
        listContainer: {
          display: "flex",
          flexDirection: "column",
          maxHeight: 400,
          backgroundColor: semanticColors.bodyBackground || palette.white,
        },
        list: {
          maxHeight: 300,
          overflowY: "auto",
        },
        item: {
          padding: "8px 12px",
          cursor: "pointer",
          fontSize: 14,
          color: semanticColors.bodyText,
          backgroundColor: "transparent",
          selectors: {
            ":hover": {
              backgroundColor: hoverBackground,
            },
          },
        },
        itemSelected: {
          backgroundColor: selectedBackground,
          selectors: {
            ":hover": {
              backgroundColor: selectedBackground,
            },
          },
        },
        emptyState: {
          padding: "8px 12px",
          color: placeholderColor,
        },
      }),
    [hoverBackground, palette, placeholderColor, semanticColors, selectedBackground],
  );

  const searchBoxStyles = useMemo(
    () => ({
      root: {
        padding: 8,
        borderBottom: `1px solid ${semanticColors.inputBorder || palette.neutralLight}`,
        background: semanticColors.bodyBackground || palette.white,
      },
      field: {
        color: semanticColors.inputText || semanticColors.bodyText,
      },
      icon: {
        color: placeholderColor,
      },
      clearButton: {
        color: placeholderColor,
      },
    }),
    [palette, placeholderColor, semanticColors],
  );

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setFilterText("");
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || calloutContentRef.current?.contains(target)) {
        return;
      }

      closeDropdown();
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("touchstart", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("touchstart", handleDocumentClick);
    };
  }, [isOpen, closeDropdown]);

  const filteredSubscriptions = subscriptions?.filter((sub) =>
    sub.displayName.toLowerCase().includes(filterText.toLowerCase()),
  );

  const handleDismiss = useCallback(() => {
    closeDropdown();
  }, [closeDropdown]);

  const handleButtonClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (isOpen) {
        closeDropdown();
        return;
      }

      setIsOpen(true);
    },
    [isOpen, closeDropdown],
  );

  const handleSelect = useCallback(
    (subscription: Subscription) => {
      setSelectedSubscriptionId(subscription.subscriptionId);
      closeDropdown();
    },
    [setSelectedSubscriptionId, closeDropdown],
  );

  return (
    <div className={classNames.container}>
      <Label>Subscription</Label>
      <button
        ref={buttonRef}
        className="accountSwitchSubscriptionDropdown"
        onClick={handleButtonClick}
        className={classNames.trigger}
      >
        <span className={classNames.triggerText}>
          {selectedSubscription?.displayName || "Select a Subscription"}
        </span>
        <span className={classNames.triggerChevron}>
          ▼
        </span>
      </button>
      {isOpen && (
        <Callout
          target={buttonRef.current}
          onDismiss={handleDismiss}
          directionalHint={DirectionalHint.bottomLeftEdge}
          isBeakVisible={false}
          gapSpace={0}
          setInitialFocus
          calloutMinWidth={buttonRef.current?.offsetWidth || 280}
          className={`${classNames.callout} accountSwitchSubscriptionDropdownMenu`}
        >
          <div ref={calloutContentRef}>
            <div className={classNames.listContainer}>
              <SearchBox
                placeholder="Filter subscriptions"
                value={filterText}
                onChange={(_, newValue) => setFilterText(newValue || "")}
                styles={searchBoxStyles}
              />
              <div className={classNames.list}>
                {filteredSubscriptions && filteredSubscriptions.length > 0 ? (
                  filteredSubscriptions.map((sub) => {
                    const isSelected = sub.subscriptionId === selectedSubscription?.subscriptionId;
                    const itemClassName = isSelected
                      ? `${classNames.item} ${classNames.itemSelected}`
                      : classNames.item;

                    return (
                      <div key={sub.subscriptionId} onClick={() => handleSelect(sub)} className={itemClassName}>
                        {sub.displayName}
                      </div>
                    );
                  })
                ) : (
                  <div className={classNames.emptyState}>No subscriptions found</div>
                )}
              </div>
            </div>
          </div>
        </Callout>
      )}
    </div>
  );
};
