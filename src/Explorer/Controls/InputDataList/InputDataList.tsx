// This component is used to create a dropdown list of options for the user to select from.
// The options are displayed in a dropdown list when the user clicks on the input field.
// The user can then select an option from the list. The selected option is then displayed in the input field.

import { getTheme } from "@fluentui/react";
import {
  Button,
  Divider,
  Input,
  Link,
  makeStyles,
  Popover,
  PopoverProps,
  PopoverSurface,
  PositioningImperativeRef,
} from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import { NormalizedEventKey } from "Common/Constants";
import { tokens } from "Explorer/Theme/ThemeUtil";
import React, { FC, useEffect, useRef } from "react";

const useStyles = makeStyles({
  container: {
    padding: 0,
  },
  input: {
    flexGrow: 1,
    paddingRight: 0,
    outline: "none",
    "& input:focus": {
      outline: "none", // Undo body :focus dashed outline
    },
  },
  inputButton: {
    border: 0,
  },
  dropdownHeader: {
    width: "100%",
    fontSize: tokens.fontSizeBase300,
    fontWeight: 600,
    padding: `${tokens.spacingVerticalM} 0 0 ${tokens.spacingVerticalM}`,
  },
  dropdownStack: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalS,
    marginBottom: "1px",
  },
  dropdownOption: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: 400,
    justifyContent: "left",
    padding: `${tokens.spacingHorizontalXS} ${tokens.spacingHorizontalS} ${tokens.spacingHorizontalXS} ${tokens.spacingHorizontalL}`,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    border: 0,
    ":hover": {
      outline: `1px dashed ${tokens.colorNeutralForeground1Hover}`,
      backgroundColor: tokens.colorNeutralBackground2Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  bottomSection: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: 400,
    padding: `${tokens.spacingHorizontalXS} ${tokens.spacingHorizontalS} ${tokens.spacingHorizontalXS} ${tokens.spacingHorizontalL}`,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
});

export interface InputDatalistDropdownOptionSection {
  label: string;
  options: string[];
}

export interface InputDataListProps {
  dropdownOptions: InputDatalistDropdownOptionSection[];
  placeholder?: string;
  title?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autofocus?: boolean; // true: acquire focus on first render
  bottomLink?: {
    text: string;
    url: string;
  };
}

export const InputDataList: FC<InputDataListProps> = ({
  dropdownOptions,
  placeholder,
  title,
  value,
  onChange,
  onKeyDown,
  autofocus,
  bottomLink,
}) => {
  const styles = useStyles();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const positioningRef = React.useRef<PositioningImperativeRef>(null);
  const [isInputFocused, setIsInputFocused] = React.useState(autofocus);
  const theme = getTheme();

  useEffect(() => {
    if (inputRef.current) {
      positioningRef.current?.setTarget(inputRef.current);
    }
  }, [inputRef, positioningRef]);

  useEffect(() => {
    if (isInputFocused) {
      inputRef.current?.focus();
    }
  }, [isInputFocused]);

  const handleOpenChange: PopoverProps["onOpenChange"] = (e, data) => {
    if (isInputFocused && !data.open) {
      // Don't close if input is focused and we're opening the dropdown (which will steal the focus)
      return;
    }

    setShowDropdown(data.open || false);
    if (data.open) {
      setIsInputFocused(true);
    }
  };

  return (
    <>
      <Input
        id="filterInput"
        ref={inputRef}
        type="text"
        size="small"
        autoComplete="off"
        className={`filterInput ${styles.input}`}
        title={title}
        placeholder={placeholder}
        value={value}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === NormalizedEventKey.Escape) {
            setShowDropdown(false);
          } else if (e.key === NormalizedEventKey.DownArrow) {
            setShowDropdown(true);
          }
          onKeyDown(e);
        }}
        onChange={(e) => {
          const newValue = e.target.value;
          // Don't show dropdown if there is already a value in the input field (when user is typing)
          setShowDropdown(!(newValue.length > 0));
          onChange(newValue);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onFocus={() => {
          // Don't show dropdown if there is already a value in the input field
          // or isInputFocused is undefined which means component is mounting
          setShowDropdown(!(value.length > 0) && isInputFocused !== undefined);

          setIsInputFocused(true);
        }}
        onBlur={() => {
          setIsInputFocused(false);
        }}
        contentAfter={
          <Button
            aria-label="Clear filter"
            className={styles.inputButton}
            size="small"
            icon={<DismissRegular />}
            onClick={() => {
              onChange("");
              setIsInputFocused(true);
            }}
          />
        }
      />
      <Popover
        inline
        unstable_disableAutoFocus
        // trapFocus
        open={showDropdown}
        onOpenChange={handleOpenChange}
        positioning={{ positioningRef, position: "below", align: "start", offset: 4 }}
      >
        <PopoverSurface className={styles.container}>
          {dropdownOptions.map((section, sectionIndex) => (
            <div key={section.label}>
              <div className={styles.dropdownHeader} style={{ color: theme.palette.themePrimary }}>
                {section.label}
              </div>
              <div className={styles.dropdownStack}>
                {section.options.map((option, index) => (
                  <Button
                    key={option}
                    appearance="transparent"
                    shape="square"
                    className={styles.dropdownOption}
                    onClick={() => {
                      onChange(option);
                      setShowDropdown(false);
                      setIsInputFocused(true);
                    }}
                    onBlur={() =>
                      !bottomLink &&
                      sectionIndex === dropdownOptions.length - 1 &&
                      index === section.options.length - 1 &&
                      setShowDropdown(false)
                    }
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {bottomLink && (
            <>
              <Divider />
              <div className={styles.bottomSection}>
                <Link href={bottomLink.url} target="_blank" onBlur={() => setShowDropdown(false)}>
                  {bottomLink.text}
                </Link>
              </div>
            </>
          )}
        </PopoverSurface>
      </Popover>
    </>
  );
};
