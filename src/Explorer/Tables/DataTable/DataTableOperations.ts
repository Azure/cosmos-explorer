import _ from "underscore";
import * as QueryBuilderConstants from "../Constants";
import * as Entities from "../Entities";
import * as Utilities from "../Utilities";

export function getRowSelector(selectorSchema: Entities.IProperty[]): string {
  let selector = "";
  selectorSchema &&
    selectorSchema.forEach((p: Entities.IProperty) => {
      selector += "[" + p.key + '="' + Utilities.jQuerySelectorEscape(p.value) + '"]';
    });
  return QueryBuilderConstants.htmlSelectors.dataTableAllRowsSelector + selector;
}

export function isRowVisible(dataTableScrollBodyQuery: JQuery<Element>, element: Element): boolean {
  let isVisible = false;

  if (dataTableScrollBodyQuery.length && element) {
    const elementRect: ClientRect = element.getBoundingClientRect(),
      dataTableScrollBodyRect: ClientRect = dataTableScrollBodyQuery.get(0).getBoundingClientRect();

    isVisible = elementRect.bottom <= dataTableScrollBodyRect.bottom && dataTableScrollBodyRect.top <= elementRect.top;
  }

  return isVisible;
}

export function scrollToRowIfNeeded(dataTableRows: JQuery<Element>, currentIndex: number, isScrollUp: boolean): void {
  if (dataTableRows.length) {
    const dataTableScrollBodyQuery: JQuery<Element> = $(
        QueryBuilderConstants.htmlSelectors.dataTableScrollBodySelector,
      ),
      selectedRowElement: Element = dataTableRows.get(currentIndex);

    if (dataTableScrollBodyQuery.length && selectedRowElement) {
      const isVisible: boolean = isRowVisible(dataTableScrollBodyQuery, selectedRowElement);

      if (!isVisible) {
        const selectedRowQuery: JQuery<Element> = $(selectedRowElement),
          scrollPosition: number = dataTableScrollBodyQuery.scrollTop(),
          selectedElementPosition: number = selectedRowQuery.position().top;
        let newScrollPosition = 0;

        if (isScrollUp) {
          newScrollPosition = scrollPosition + selectedElementPosition;
        } else {
          newScrollPosition =
            scrollPosition + (selectedElementPosition + selectedRowQuery.height() - dataTableScrollBodyQuery.height());
        }

        dataTableScrollBodyQuery.scrollTop(newScrollPosition);
      }
    }
  }
}

export function scrollToTopIfNeeded(): void {
  const $dataTableRows: JQuery<Element> = $(QueryBuilderConstants.htmlSelectors.dataTableAllRowsSelector),
    $dataTableScrollBody: JQuery<Element> = $(QueryBuilderConstants.htmlSelectors.dataTableScrollBodySelector);

  if ($dataTableRows.length && $dataTableScrollBody.length) {
    $dataTableScrollBody.scrollTop(0);
  }
}

export function setPaginationButtonEventHandlers(): void {
  $(QueryBuilderConstants.htmlSelectors.dataTablePaginationButtonSelector)
    .on("mousedown", (event: JQueryEventObject) => {
      // Prevents the table contents from briefly jumping when clicking on "Load more"
      event.preventDefault();
    })
    .attr("role", "button");
}

// export function filterColumns(table: DataTables.DataTable, settings: boolean[]): void {
//   settings &&
//     settings.forEach((value: boolean, index: number) => {
//       table.column(index).visible(value, false);
//     });
//   table.columns.adjust().draw(false);
// }

/**
 * Reorder columns based on current order.
 * If no current order is specified, reorder the columns based on intial order.
 */
// export function reorderColumns(
//   table: DataTables.DataTable,
//   targetOrder: number[],
//   currentOrder?: number[],
//   //eslint-disable-next-line
// ): Q.Promise<any> {
//   const columnsCount: number = targetOrder.length;
//   const isCurrentOrderPassedIn = !!currentOrder;
//   if (!isCurrentOrderPassedIn) {
//     currentOrder = getInitialOrder(columnsCount);
//   }
//   const isSameOrder: boolean = Utilities.isEqual(currentOrder, targetOrder);

//   // if the targetOrder is the same as current order, do nothing.
//   if (!isSameOrder) {
//     // Otherwise, calculate the transformation order.
//     // If current order not specified, then it'll be set to initial order,
//     //  i.e., either no reorder happened before or reordering to its initial order,
//     //  Then the transformation order will be the same as target order.
//     // If current order is specified, then a transformation order is calculated.
//     //  Refer to calculateTransformationOrder for details about transformation order.
//     const transformationOrder: number[] = isCurrentOrderPassedIn
//       ? calculateTransformationOrder(currentOrder, targetOrder)
//       : targetOrder;
//     try {
//       $.fn.dataTable.ColReorder(table).fnOrder(transformationOrder);
//     } catch (err) {
//       return Q.reject(err);
//     }
//   }
//   return Q.resolve(null);
// }

// export function resetColumns(table: DataTables.DataTable): void {
//   $.fn.dataTable.ColReorder(table).fnReset();
// }

/**
 * A table's initial order is described in the form of a natural ascending order.
 * E.g., for a table with 9 columns, the initial order will be: [0, 1, 2, 3, 4, 5, 6, 7, 8]
 */
export function getInitialOrder(columnsCount: number): number[] {
  return _.range(columnsCount);
}

/**
 * Get current table's column order which is described based on initial table. E.g.,
 * Initial order:  I = [0, 1, 2, 3, 4, 5, 6, 7, 8]   <---->   {prop0, prop1, prop2, prop3, prop4, prop5, prop6, prop7, prop8}
 * Current order:  C = [0, 1, 2, 6, 7, 3, 4, 5, 8]   <---->   {prop0, prop1, prop2, prop6, prop7, prop3, prop4, prop5, prop8}
 */
// export function getCurrentOrder(table: DataTables.DataTable): number[] {
//   return $.fn.dataTable.ColReorder(table).fnOrder();
// }

/**
 * Switch the index and value for each element of an array. e.g.,
 * InputArray: [0, 1, 2, 6, 7, 3, 4, 5, 8]
 * Result:     [0, 1, 2, 5, 6, 7, 3, 4, 8]
 */
export function invertIndexValues(inputArray: number[]): number[] {
  const invertedArray: number[] = [];
  if (inputArray) {
    inputArray.forEach((value: number, index: number) => {
      invertedArray[inputArray[index]] = index;
    });
  }

  return invertedArray;
}

/**
 * DataTable fnOrder API is based on the current table. So we need to map the order targeting original table to targeting current table.
 * An detailed example for this. Assume the table has 9 columns.
 * Initial order (order of the initial table):  I = [0, 1, 2, 3, 4, 5, 6, 7, 8]   <---->   {prop0, prop1, prop2, prop3, prop4, prop5, prop6, prop7, prop8}
 * Current order (order of the current table):  C = [0, 1, 2, 6, 7, 3, 4, 5, 8]   <---->   {prop0, prop1, prop2, prop6, prop7, prop3, prop4, prop5, prop8}
 * Target order (order of the targeting table): T = [0, 1, 2, 5, 6, 7, 8, 3, 4]   <---->   {prop0, prop1, prop2, prop5, prop6, prop7, prop8, prop3, prop4}
 * Transformation order: an order passed to fnOrder API that transforms table from current order to target order.
 * When the table is constructed, it has the intial order. After an reordering with current order array, now the table is shown in current order, e.g.,
 * column 3 in the current table is actually column C[3]=6 in the intial table, both indicate the column with header prop6.
 * Now we want to continue to do another reorder to make the target table in the target order. Directly invoking API with the new order won't work as
 * the API only do reorder based on the current table like the first time we invoke the API. So an order based on the current table needs to be calulated.
 * Here is an example of how to calculate the transformation order:
 * In target table, column 3 should be column T[3]=5 in the intial table with header prop5, while in current table, column with header prop5 is column 7 as C[7]=5.
 * As a result, in transformation order, column 3 in the target table should be column 7 in the current table, Trans[3] = 7. In the same manner, we can get the
 * transformation order: Trans = [0, 1, 2, 7, 3, 4, 8, 5, 6]
 */
export function calculateTransformationOrder(currentOrder: number[], targetOrder: number[]): number[] {
  let transformationOrder: number[] = [];
  if (currentOrder && targetOrder && currentOrder.length === targetOrder.length) {
    const invertedCurrentOrder: number[] = invertIndexValues(currentOrder);
    transformationOrder = targetOrder.map((value: number) => invertedCurrentOrder[value]);
  }
  return transformationOrder;
}

// export function getDataTableHeaders(table: DataTables.DataTable): string[] {
//   const columns: DataTables.ColumnsMethods = table.columns();
//   let headers: string[] = [];
//   if (columns) {
//     // table.columns() return ColumnsMethods which is an array of arrays
//     //eslint-disable-next-line
//     const columnIndexes: number[] = (<any>columns)[0];
//     if (columnIndexes) {
//       headers = columnIndexes.map((value: number) => $(table.columns(value).header()).html());
//     }
//   }
//   return headers;
// }
