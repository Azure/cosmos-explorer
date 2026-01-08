import { Callout, DirectionalHint, ISearchBoxStyles, Label, SearchBox } from "@fluentui/react";
import * as React from "react";
import { useCallback, useRef, useState } from "react";

interface SearchableDropdownProps<T> {
  label: string;
  items: T[];
  selectedItem: T | null;
  onSelect: (item: T) => void;
  getKey: (item: T) => string;
  getDisplayText: (item: T) => string;
  placeholder?: string;
  filterPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  onDismiss?: () => void;
  buttonStyles?: React.CSSProperties;
  searchBoxStyles?: Partial<ISearchBoxStyles>;
  listStyles?: React.CSSProperties;
  itemStyles?: React.CSSProperties;
}

export const SearchableDropdown = <T,>({
  label,
  items,
  selectedItem,
  onSelect,
  getKey,
  getDisplayText,
  placeholder = "Select an item",
  filterPlaceholder = "Filter items",
  className,
  disabled = false,
  onDismiss,
  buttonStyles: customButtonStyles,
  searchBoxStyles: customSearchBoxStyles,
  listStyles: customListStyles,
  itemStyles: customItemStyles,
}: SearchableDropdownProps<T>): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  const defaultButtonStyles: React.CSSProperties = {
    width: "100%",
    height: "32px",
    padding: "0 28px 0 8px",
    border: "1px solid #8a8886",
    background: "#fff",
    color: "#323130",
    textAlign: "left",
    cursor: disabled ? "not-allowed" : "pointer",
    position: "relative",
    fontFamily: "inherit",
    fontSize: "14px",
  };

  const defaultListStyles: React.CSSProperties = {
    maxHeight: "300px",
    overflowY: "auto",
  };

  const defaultItemStyles: React.CSSProperties = {
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "14px",
  };

  // Merge custom styles with defaults
  const buttonStyles = { ...defaultButtonStyles, ...customButtonStyles };
  const listStyles = { ...defaultListStyles, ...customListStyles };
  const itemStyles = { ...defaultItemStyles, ...customItemStyles };

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setFilterText("");
  }, []);

  const filteredItems = items?.filter((item) => getDisplayText(item).toLowerCase().includes(filterText.toLowerCase()));

  const handleDismiss = useCallback(() => {
    closeDropdown();
    onDismiss?.();
  }, [closeDropdown, onDismiss]);

  const handleButtonClick = useCallback(
    (event: React.MouseEvent) => {
      if (disabled) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      if (isOpen) {
        closeDropdown();
        return;
      }

      setIsOpen(true);
      return;
    },
    [isOpen, closeDropdown, disabled],
  );

  const handleSelect = useCallback(
    (item: T) => {
      onSelect(item);
      closeDropdown();
    },
    [onSelect, closeDropdown],
  );

  const buttonLabel = selectedItem
    ? getDisplayText(selectedItem)
    : items?.length === 0
    ? `No ${label}s Found`
    : placeholder;

  const buttonId = `${className}-button`;

  return (
    <div>
      <Label htmlFor={buttonId}>{label}</Label>
      <button
        id={buttonId}
        ref={buttonRef}
        className={className}
        onClick={handleButtonClick}
        style={buttonStyles}
        disabled={disabled}
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
        >
          <div style={{ width: buttonRef.current?.offsetWidth || 300, display: "flex", flexDirection: "column" }}>
            <SearchBox
              placeholder={filterPlaceholder}
              value={filterText}
              onChange={(_, newValue) => setFilterText(newValue || "")}
              styles={customSearchBoxStyles}
            />
            <div style={listStyles}>
              {filteredItems && filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const key = getKey(item);
                  const isSelected = selectedItem ? getKey(selectedItem) === key : false;
                  return (
                    <div
                      key={key}
                      onClick={() => handleSelect(item)}
                      style={{
                        ...itemStyles,
                        backgroundColor: isSelected ? "#e6e6e6" : "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f2f1")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = isSelected ? "#e6e6e6" : "transparent")
                      }
                    >
                      {getDisplayText(item)}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "8px 12px", color: "#605e5c" }}>No items found</div>
              )}
            </div>
          </div>
        </Callout>
      )}
    </div>
  );
};
