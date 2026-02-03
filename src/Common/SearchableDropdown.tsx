import {
  Callout,
  DefaultButton,
  DirectionalHint,
  Icon,
  ISearchBoxStyles,
  Label,
  SearchBox,
  Stack,
  Text,
} from "@fluentui/react";
import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  buttonLabelStyles,
  buttonWrapperStyles,
  calloutContentStyles,
  chevronStyles,
  emptyMessageStyles,
  getDropdownButtonStyles,
  getItemStyles,
  listContainerStyles,
} from "./SearchableDropdown.styles";

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
  searchBoxStyles?: Partial<ISearchBoxStyles>;
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
  searchBoxStyles: customSearchBoxStyles,
}: SearchableDropdownProps<T>): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const buttonRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setFilterText("");
  }, []);

  const filteredItems = useMemo(
    () => items?.filter((item) => getDisplayText(item).toLowerCase().includes(filterText.toLowerCase())),
    [items, filterText, getDisplayText],
  );

  const handleDismiss = useCallback(() => {
    closeDropdown();
    onDismiss?.();
  }, [closeDropdown, onDismiss]);

  const handleButtonClick = useCallback(() => {
    if (disabled) {
      return;
    }

    setIsOpen(!isOpen);
  }, [isOpen, disabled]);

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
  const buttonStyles = getDropdownButtonStyles(disabled);

  return (
    <Stack>
      <Label htmlFor={buttonId}>{label}</Label>
      <div ref={buttonRef} style={buttonWrapperStyles}>
        <DefaultButton
          id={buttonId}
          className={className}
          onClick={handleButtonClick}
          styles={buttonStyles}
          disabled={disabled}
        >
          <Text styles={buttonLabelStyles}>{buttonLabel}</Text>
        </DefaultButton>
        <Icon iconName="ChevronDown" style={chevronStyles} />
      </div>
      {isOpen && (
        <Callout
          target={buttonRef.current}
          onDismiss={handleDismiss}
          directionalHint={DirectionalHint.bottomLeftEdge}
          isBeakVisible={false}
          gapSpace={0}
          setInitialFocus
        >
          <Stack styles={calloutContentStyles} style={{ width: buttonRef.current?.offsetWidth || 300 }}>
            <SearchBox
              placeholder={filterPlaceholder}
              value={filterText}
              onChange={(_, newValue) => setFilterText(newValue || "")}
              styles={customSearchBoxStyles}
              showIcon={true}
            />
            <Stack styles={listContainerStyles}>
              {filteredItems && filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const key = getKey(item);
                  const isSelected = selectedItem ? getKey(selectedItem) === key : false;
                  return (
                    <div
                      key={key}
                      onClick={() => handleSelect(item)}
                      style={getItemStyles(isSelected)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f2f1")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = isSelected ? "#e6e6e6" : "transparent")
                      }
                    >
                      <Text>{getDisplayText(item)}</Text>
                    </div>
                  );
                })
              ) : (
                <Text styles={emptyMessageStyles}>No items found</Text>
              )}
            </Stack>
          </Stack>
        </Callout>
      )}
    </Stack>
  );
};
