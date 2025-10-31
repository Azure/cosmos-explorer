import { IconButton, Text } from "@fluentui/react";
import * as React from "react";
import "./Pager.css";

export interface PagerProps {
    startIndex: number;
    totalCount: number;
    pageSize: number;
    onLoadPage: (startIndex: number, pageSize: number) => void;
    disabled?: boolean;
    showFirstLast?: boolean;
    showItemCount?: boolean;
    className?: string;
}

const iconButtonStyles = {
    root: {
        backgroundColor: "transparent",
    },
    rootHovered: {
        backgroundColor: "transparent",
    },
    rootPressed: {
        backgroundColor: "transparent",
    },
    rootDisabled: {
        backgroundColor: "transparent",
    },
    rootFocused: {
        backgroundColor: "transparent",
        outline: "none",
    },
};

const Pager: React.FC<PagerProps> = ({
    startIndex,
    totalCount,
    pageSize,
    onLoadPage,
    disabled = false,
    showFirstLast = true,
    showItemCount = true,
    className,
}) => {
    // Calculate current page and total pages from startIndex
    const currentPage = Math.floor(startIndex / pageSize) + 1;
    const totalPages = Math.ceil(totalCount / pageSize);
    const endIndex = Math.min(startIndex + pageSize, totalCount);

    const handleFirstPage = () => onLoadPage(0, pageSize);
    const handlePreviousPage = () => onLoadPage(startIndex - pageSize, pageSize);
    const handleNextPage = () => onLoadPage(startIndex + pageSize, pageSize);
    const handleLastPage = () => onLoadPage((totalPages - 1) * pageSize, pageSize);

    if (totalCount === 0) {
        return null;
    }

    return (
        <div className={className || "pager-container"}>
            {showItemCount && (
                <Text>
                    Showing {startIndex + 1} - {endIndex} of {totalCount} items
                </Text>
            )}
            <div>
                {showFirstLast && (
                    <IconButton
                        iconProps={{ iconName: "DoubleChevronLeft" }}
                        title="First page"
                        ariaLabel="Go to first page"
                        onClick={handleFirstPage}
                        disabled={disabled || currentPage === 1}
                        styles={iconButtonStyles}
                    />
                )}
                <IconButton
                    iconProps={{ iconName: "ChevronLeft" }}
                    title="Previous page"
                    ariaLabel="Go to previous page"
                    onClick={handlePreviousPage}
                    disabled={disabled || currentPage === 1}
                    styles={iconButtonStyles}
                />
                <Text>
                    Page {currentPage} of {totalPages}
                </Text>
                <IconButton
                    iconProps={{ iconName: "ChevronRight" }}
                    title="Next page"
                    ariaLabel="Go to next page"
                    onClick={handleNextPage}
                    disabled={disabled || currentPage === totalPages}
                    styles={iconButtonStyles}
                />
                {showFirstLast && (
                    <IconButton
                        iconProps={{ iconName: "DoubleChevronRight" }}
                        title="Last page"
                        ariaLabel="Go to last page"
                        onClick={handleLastPage}
                        disabled={disabled || currentPage === totalPages}
                        styles={iconButtonStyles}
                    />
                )}
            </div>
        </div>
    );
};

export default Pager;
