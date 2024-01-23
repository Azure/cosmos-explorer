import * as DataTable from "datatables.net-dt";
import * as Utilities from "../Utilities";

/**
 * Wrapper function for creating data tables. Call this method, not the
 * data tables constructor when you want to create a data table. This
 * function makes sure that content without a render function is properly
 * encoded to prevent XSS.
 * @param{$dataTableElem} JQuery data table element
 * @param{$settings} Settings to use when creating the data table
 */
export function createDataTable($dataTableElem: JQuery, settings: any): DataTable.Api<HTMLElement> {
  return $dataTableElem.DataTable(applyDefaultRendering(settings));
}

/**
 * Go through the settings for a data table and apply a simple HTML encode to any column
 * without a render function to prevent XSS.
 * @param{settings} The settings to check
 * @return The given settings with all columns having a rendering function
 */
function applyDefaultRendering(settings: DataTable.Config): any {
  var tableColumns: any[] = null;

  if (settings.columns) {
    tableColumns = settings.columns;
  } else if (settings.columnDefs) {
    // for tables we use aoColumnDefs instead of aoColumns
    tableColumns = settings.columnDefs;
  }

  // either the settings had no columns defined, or they were called
  // by a property name which we have not used before
  if (!tableColumns) {
    return settings;
  }

  for (var i = 0; i < tableColumns.length; i++) {
    // the column does not have a render function
    if (!tableColumns[i].mRender) {
      tableColumns[i].mRender = defaultDataRender;
    }
  }
  return settings;
}

/**
 * Default data render function, whatever is done to data in here
 * will be done to any data which we do not specify a render for.
 */
function defaultDataRender(data: any, type: string, full: any) {
  return Utilities.htmlEncode(data);
}
