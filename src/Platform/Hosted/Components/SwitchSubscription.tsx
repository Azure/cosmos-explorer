import { Callout, DirectionalHint, Label, SearchBox, useTheme } from "@fluentui/react";
import * as React from "react";
import { FunctionComponent, useCallback, useEffect, useRef, useState } from "react";
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

  const buttonStyles: React.CSSProperties = {
    width: "100%",
    height: "32px",
    padding: "0 28px 0 8px",
    border: `1px solid ${semanticColors.inputBorder || palette.neutralSecondary}`,
    background: semanticColors.inputBackground || palette.white,
    color: semanticColors.inputText || semanticColors.bodyText,
    textAlign: "left",
    cursor: "pointer",
    position: "relative",
    fontFamily: "inherit",
    fontSize: "14px",
  };

  const listContainerStyles: React.CSSProperties = {
    width: buttonRef.current?.offsetWidth || 300,
    maxHeight: "400px",
    display: "flex",
    flexDirection: "column",
    background: semanticColors.bodyBackground || palette.white,
  };

  const listStyles: React.CSSProperties = {
    maxHeight: "300px",
    overflowY: "auto",
    background: semanticColors.bodyBackground || palette.white,
  };

  const hoverBackground = semanticColors.menuItemBackgroundHovered || palette.neutralLighterAlt;
  const selectedBackground = semanticColors.menuItemBackgroundChecked || palette.neutralLighter;
  const placeholderColor = semanticColors.bodySubtext || palette.neutralTertiary;

  const getItemStyles = (isSelected: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    cursor: "pointer",
    backgroundColor: isSelected ? selectedBackground : "transparent",
    fontSize: "14px",
    color: semanticColors.bodyText,
  });

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
    <div>
      <Label>Subscription</Label>
      <button
        ref={buttonRef}
        className="accountSwitchSubscriptionDropdown"
        onClick={handleButtonClick}
        style={buttonStyles}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
          {selectedSubscription?.displayName || "Select a Subscription"}
        </span>
        <span
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
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
          className="accountSwitchSubscriptionDropdownMenu"
        >
          <div ref={calloutContentRef}>
            <div style={listContainerStyles}>
              <SearchBox
                placeholder="Filter subscriptions"
                value={filterText}
                onChange={(_, newValue) => setFilterText(newValue || "")}
                styles={{
                  root: {
                    padding: "8px",
                    borderBottom: `1px solid ${semanticColors.inputBorder || palette.neutralLight}`,
                    background: semanticColors.bodyBackground || palette.white,
                  },
                  field: {
                    color: semanticColors.inputText || semanticColors.bodyText,
                  },
                }}
              />
              <div style={listStyles}>
                {filteredSubscriptions && filteredSubscriptions.length > 0 ? (
                  filteredSubscriptions.map((sub) => (
                    <div
                      key={sub.subscriptionId}
                      onClick={() => handleSelect(sub)}
                      style={getItemStyles(sub.subscriptionId === selectedSubscription?.subscriptionId)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBackground)}
                      onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        sub.subscriptionId === selectedSubscription?.subscriptionId
                          ? selectedBackground
                          : "transparent")
                      }
                    >
                      {sub.displayName}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "8px 12px", color: placeholderColor }}>No subscriptions found</div>
                )}
              </div>
            </div>
          </div>
        </Callout>
      )}
    </div>
  );
};
