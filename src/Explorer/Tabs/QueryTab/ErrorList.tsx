import {
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  TableCellLayout,
  TableColumnDefinition,
  TableColumnSizingOptions,
  createTableColumn,
  tokens,
} from "@fluentui/react-components";
import { ErrorCircleFilled, MoreHorizontalRegular, QuestionRegular, WarningFilled } from "@fluentui/react-icons";
import QueryError, { QueryErrorSeverity, compareSeverity } from "Common/QueryError";
import { useQueryTabStyles } from "Explorer/Tabs/QueryTab/Styles";
import { useNotificationConsole } from "hooks/useNotificationConsole";
import React from "react";

const severityIcons = {
  [QueryErrorSeverity.Error]: <ErrorCircleFilled color={tokens.colorPaletteRedBackground3} />,
  [QueryErrorSeverity.Warning]: <WarningFilled color={tokens.colorPaletteYellowForeground1} />,
};

export const ErrorList: React.FC<{ errors: QueryError[] }> = ({ errors }) => {
  const styles = useQueryTabStyles();
  const onErrorDetailsClick = (): boolean => {
    useNotificationConsole.getState().expandConsole();
    return false;
  };

  const columns: TableColumnDefinition<QueryError>[] = [
    createTableColumn<QueryError>({
      columnId: "code",
      compare: (item1, item2) => item1.code.localeCompare(item2.code),
      renderHeaderCell: () => "Code",
      renderCell: (item) => <TableCellLayout truncate>{item.code}</TableCellLayout>,
    }),
    createTableColumn<QueryError>({
      columnId: "severity",
      compare: (item1, item2) => compareSeverity(item1.severity, item2.severity),
      renderHeaderCell: () => "Severity",
      renderCell: (item) => (
        <TableCellLayout truncate media={severityIcons[item.severity]}>
          {item.severity}
        </TableCellLayout>
      ),
    }),
    createTableColumn<QueryError>({
      columnId: "location",
      compare: (item1, item2) => item1.location?.start?.offset - item2.location?.start?.offset,
      renderHeaderCell: () => "Location",
      renderCell: (item) => (
        <TableCellLayout truncate>
          {item.location
            ? item.location.start.lineNumber
              ? `Line ${item.location.start.lineNumber}`
              : "<unknown>"
            : "<no location>"}
        </TableCellLayout>
      ),
    }),
    createTableColumn<QueryError>({
      columnId: "message",
      compare: (item1, item2) => item1.message.localeCompare(item2.message),
      renderHeaderCell: () => "Message",
      renderCell: (item) => (
        <div className={styles.errorListMessageCell}>
          <div className={styles.errorListMessage} title={item.message}>
            {item.message}
          </div>
          <div className={styles.errorListMessageActions}>
            {item.helpLink && (
              <Button
                as="a"
                aria-label="Help"
                appearance="subtle"
                icon={<QuestionRegular />}
                href={item.helpLink}
                target="_blank"
              />
            )}
            <Button
              aria-label="Details"
              appearance="subtle"
              icon={<MoreHorizontalRegular />}
              onClick={onErrorDetailsClick}
            />
          </div>
        </div>
      ),
    }),
  ];

  const columnSizingOptions: TableColumnSizingOptions = {
    code: {
      minWidth: 90,
      idealWidth: 90,
      defaultWidth: 90,
    },
    severity: {
      minWidth: 100,
      idealWidth: 100,
      defaultWidth: 100,
    },
    location: {
      minWidth: 100,
      idealWidth: 100,
      defaultWidth: 100,
    },
    message: {
      minWidth: 500,
    },
  };

  return (
    <DataGrid
      data-testid="QueryTab/ResultsPane/ErrorList"
      items={errors}
      columns={columns}
      sortable
      resizableColumns
      columnSizingOptions={columnSizingOptions}
      focusMode="composite"
    >
      <DataGridHeader>
        <DataGridRow>
          {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<QueryError>>
        {({ item, rowId }) => (
          <DataGridRow<QueryError> key={rowId} data-testid={`Row:${rowId}`}>
            {({ columnId, renderCell }) => (
              <DataGridCell data-testid={`Row:${rowId}/Column:${columnId}`}>{renderCell(item)}</DataGridCell>
            )}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
};
