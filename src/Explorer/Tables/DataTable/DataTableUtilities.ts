import * as _ from "underscore";
import * as Constants from "../Constants";
import * as Entities from "../Entities";
import * as TableEntityProcessor from "../TableEntityProcessor";

export enum IconState {
  default,
  hoverState,
  toggleOn,
}

/**
 * Represents an html input element shown in context menu.
 * name: the input name
 * type: the input type, e.g., "text", "checkbox", "radio", etc.
 * selected: optional. Used when the input type is checkbox. True means checkbox is selected. Otherwise, unselected.
 */
export interface IContextMenuInputItem {
  name: string;
  type: string;
  selected?: boolean;
}

export interface IContextMenuOption {
  [key: string]: IContextMenuInputItem;
}

export function containMultipleItems<T>(items: T[]): boolean {
  return items && items.length > 1;
}

export function containSingleItem<T>(items: T[]): boolean {
  return items && items.length === 1;
}

export function containItems<T>(items: T[]): boolean {
  return items && items.length > 0;
}

export function addCssClass($sourceElement: JQuery, cssClassName: string): void {
  if (!$sourceElement.hasClass(cssClassName)) {
    $sourceElement.addClass(cssClassName);
  }
}

export function removeCssClass($sourceElement: JQuery, cssClassName: string): void {
  if ($sourceElement.hasClass(cssClassName)) {
    $sourceElement.removeClass(cssClassName);
  }
}

/**
 * Get the property union of input entities.
 * Example:
 * Input:
 *  Entities: [{ PrimaryKey, id, Prop1, Prop2 }, { PrimaryKey, id, Prop2, Prop3, Prop4 }]
 * Return:
 *  Union: [PrimaryKey, id, Prop1, Prop2, Prop3, Prop4]
 */
export function getPropertyIntersectionFromTableEntities(
  entities: Entities.ITableEntity[],
  isCassandraApi: boolean,
): string[] {
  const headerUnion: string[] = [];
  entities &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entities.forEach((row: any) => {
      const keys = Object.keys(row);
      keys &&
        keys.forEach((key: string) => {
          if (
            key !== ".metadata" &&
            !_.contains(headerUnion, key) &&
            key !== TableEntityProcessor.keyProperties.attachments &&
            key !== TableEntityProcessor.keyProperties.etag &&
            key !== TableEntityProcessor.keyProperties.resourceId &&
            key !== TableEntityProcessor.keyProperties.self &&
            (!isCassandraApi || key !== Constants.EntityKeyNames.RowKey)
          ) {
            headerUnion.push(key);
          }
        });
    });
  return headerUnion;
}

/**
 * Compares the names of two Azure table columns and returns a number indicating which comes before the other.
 * System-defined properties come before custom properties. Otherwise they are compared using string comparison.
 */
export function compareTableColumns(a: string, b: string): number {
  if (a === "PartitionKey") {
    if (b !== "PartitionKey") {
      return -1;
    }
  } else if (a === "RowKey") {
    if (b === "PartitionKey") {
      return 1;
    } else if (b !== "RowKey") {
      return -1;
    }
  } else if (a === "Timestamp") {
    if (b === "PartitionKey" || b === "RowKey") {
      return 1;
    } else if (b !== "Timestamp") {
      return -1;
    }
  } else if (b === "PartitionKey" || b === "RowKey" || b === "Timestamp") {
    return 1;
  }

  return a.localeCompare(b);
}

export function checkForDefaultHeader(headers: string[]): boolean {
  return headers[0] === Constants.defaultHeader;
}

/**
 * DataTableBindingManager registers an event handler of body.resize and recalculates the data table size.
 * This method forces the event to happen.
 */
export function forceRecalculateTableSize(): void {
  $("body").trigger("resize");
}

/**
 * Turns off the spinning progress indicator on the data table.
 */
export function turnOffProgressIndicator(): void {
  $("div.dataTables_processing").hide();
}
