import { Callout, DirectionalHint, Label, SearchBox, useTheme } from "@fluentui/react";
import * as React from "react";
import { FunctionComponent, useCallback, useEffect, useRef, useState } from "react";
import { DatabaseAccount } from "../../../Contracts/DataModels";

interface Props {
  accounts: DatabaseAccount[];
  selectedAccount: DatabaseAccount;
  setSelectedAccountName: (id: string) => void;
  dismissMenu?: () => void;
}

export const SwitchAccount: FunctionComponent<Props> = ({
  accounts,
  setSelectedAccountName,
  selectedAccount,
  dismissMenu,
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
    cursor: accounts && accounts.length === 0 ? "not-allowed" : "pointer",
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

  const filteredAccounts = accounts?.filter((account) =>
    account.name.toLowerCase().includes(filterText.toLowerCase()),
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
    (account: DatabaseAccount) => {
      setSelectedAccountName(account.name);
      closeDropdown();
      dismissMenu?.();
    },
    [setSelectedAccountName, closeDropdown, dismissMenu],
  );

  const buttonLabel = selectedAccount?.name || (accounts && accounts.length === 0 ? "No Accounts Found" : "Select an Account");

  return (
    <div>
      <Label>Cosmos DB Account Name</Label>
      <button
        ref={buttonRef}
        className="accountSwitchAccountDropdown"
        onClick={handleButtonClick}
        style={buttonStyles}
        disabled={!accounts || accounts.length === 0}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
          {buttonLabel}
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
          className="accountSwitchAccountDropdownMenu"
        >
          <div ref={calloutContentRef}>
            <div style={listContainerStyles}>
              <SearchBox
                placeholder="Filter accounts"
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
                {filteredAccounts && filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <div
                      key={account.name}
                      onClick={() => handleSelect(account)}
                      style={getItemStyles(account.name === selectedAccount?.name)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBackground)}
                      onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        account.name === selectedAccount?.name ? selectedBackground : "transparent")
                      }
                    >
                      {account.name}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "8px 12px", color: placeholderColor }}>No accounts found</div>
                )}
              </div>
            </div>
          </div>
        </Callout>
      )}
    </div>
  );
};
