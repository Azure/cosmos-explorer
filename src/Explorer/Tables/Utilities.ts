import * as _ from "underscore";
import Q from "q";
import * as Entities from "./Entities";
import { CassandraTableKey } from "./TableDataClient";
import * as Constants from "./Constants";

/**
 * Generates a pseudo-random GUID.
 */
export function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
}

/**
 * Returns a promise that resolves in the specified number of milliseconds.
 */
export function delay(milliseconds: number): Q.Promise<any> {
  return Q.delay(milliseconds);
}

/**
 * Given a value and minimum and maximum limits, returns the value if it is within the limits
 * (inclusive); or the maximum or minimum limit, if the value is greater or lesser than the
 * respective limit.
 */
export function ensureBetweenBounds(value: number, minimum: number, maximum: number): number {
  return Math.max(Math.min(value, maximum), minimum);
}

/**
 * Retrieves an appropriate error message for an error.
 * @param error The actual error
 * @param simpleMessage A simpler message to use instead of the actual error.
 * If supplied, the original error will be added as "details".
 */
export function getErrorMessage(error: any, simpleMessage?: string): string {
  var detailsMessage: string;
  if (typeof error === "string" || error instanceof String) {
    detailsMessage = error.toString();
  } else {
    detailsMessage = error.message || error.error || error.name;
  }

  if (simpleMessage && detailsMessage) {
    return simpleMessage + getEnvironmentNewLine() + getEnvironmentNewLine() + "Details: " + detailsMessage;
  } else if (simpleMessage) {
    return simpleMessage;
  } else {
    return detailsMessage || "An unexpected error has occurred.";
  }
}

/**
 * Get the environment's new line characters
 */
export function getEnvironmentNewLine(): string {
  var platform = navigator.platform.toUpperCase();

  if (platform.indexOf("WIN") >= 0) {
    return "\r\n";
  } else {
    // Mac OS X and *nix
    return "\n";
  }
}

/**
 * Tests whether two arrays have same elements in the same sequence.
 */
export function isEqual<T>(a: T[], b: T[]): boolean {
  var isEqual: boolean = false;
  if (!!a && !!b && a.length === b.length) {
    isEqual = _.every(a, (value: T, index: number) => value === b[index]);
  }
  return isEqual;
}

/**
 * Escape meta-characters for jquery selector
 */
export function jQuerySelectorEscape(value: string): string {
  value = value || "";
  return value.replace(/[!"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, "\\$&");
}

export function copyTableQuery(query: Entities.ITableQuery): Entities.ITableQuery {
  if (!query) {
    return null;
  }

  return {
    filter: query.filter,
    select: query.select && query.select.slice(),
    top: query.top,
  };
}

/**
 * Html encode
 */
export function htmlEncode(value: string): string {
  var _divElem: JQuery = $("<div/>");
  return _divElem.text(value).html();
}

/**
 * Executes an action on a keyboard event.
 * Modifiers: ctrlKey - control/command key, shiftKey - shift key, altKey - alt/option key;
 * pass on 'null' to ignore the modifier (default).
 */
export function onKey(
  event: any,
  eventKeyCode: number,
  action: ($sourceElement: JQuery) => void,
  metaKey: boolean = null,
  shiftKey: boolean = null,
  altKey: boolean = null,
): boolean {
  var source: any = event.target || event.srcElement,
    keyCode: number = event.keyCode,
    $sourceElement = $(source),
    handled: boolean = false;

  if (
    $sourceElement.length &&
    keyCode === eventKeyCode &&
    $.isFunction(action) &&
    (metaKey === null || metaKey === event.metaKey) &&
    (shiftKey === null || shiftKey === event.shiftKey) &&
    (altKey === null || altKey === event.altKey)
  ) {
    action($sourceElement);
    handled = true;
  }

  return handled;
}

/**
 * Executes an action on an 'enter' keyboard event.
 */
export function onEnter(
  event: any,
  action: ($sourceElement: JQuery) => void,
  metaKey: boolean = null,
  shiftKey: boolean = null,
  altKey: boolean = null,
): boolean {
  return onKey(event, Constants.keyCodes.Enter, action, metaKey, shiftKey, altKey);
}

/**
 * Executes an action on a 'tab' keyboard event.
 */
export function onTab(
  event: any,
  action: ($sourceElement: JQuery) => void,
  metaKey: boolean = null,
  shiftKey: boolean = null,
  altKey: boolean = null,
): boolean {
  return onKey(event, Constants.keyCodes.Tab, action, metaKey, shiftKey, altKey);
}

/**
 * Executes an action on an 'Esc' keyboard event.
 */
export function onEsc(
  event: any,
  action: ($sourceElement: JQuery) => void,
  metaKey: boolean = null,
  shiftKey: boolean = null,
  altKey: boolean = null,
): boolean {
  return onKey(event, Constants.keyCodes.Esc, action, metaKey, shiftKey, altKey);
}

/**
 * Is the environment 'ctrl' key press. This key is used for multi selection, like select one more item, select all.
 * For Windows and Linux, it's ctrl. For Mac, it's command.
 */
export function isEnvironmentCtrlPressed(event: JQueryEventObject): boolean {
  return isMac() ? event.metaKey : event.ctrlKey;
}

export function isEnvironmentShiftPressed(event: JQueryEventObject): boolean {
  return event.shiftKey;
}

export function isEnvironmentAltPressed(event: JQueryEventObject): boolean {
  return event.altKey;
}

/**
 * Returns whether the current platform is MacOS.
 */
export function isMac(): boolean {
  var platform = navigator.platform.toUpperCase();
  return platform.indexOf("MAC") >= 0;
}

// MAX_SAFE_INTEGER and MIN_SAFE_INTEGER will be provided by ECMAScript 6's Number
export var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
export var MIN_SAFE_INTEGER = -MAX_SAFE_INTEGER;

/**
 * Tests whether a value a safe integer.
 * A safe integer is an integer that can be exactly represented as an IEEE-754 double precision number (all integers from (2^53 - 1) to -(2^53 - 1))
 * Note: Function and constants will be provided by ECMAScript 6's Number.
 */
export function isSafeInteger(value: any): boolean {
  var n: number = typeof value !== "number" ? Number(value) : value;

  return Math.round(n) === n && MIN_SAFE_INTEGER <= n && n <= MAX_SAFE_INTEGER;
}

export function getInputTypeFromDisplayedName(displayedName: string): string {
  switch (displayedName) {
    case Constants.TableType.DateTime:
      return Constants.InputType.DateTime;
    case Constants.TableType.Int32:
    case Constants.TableType.Int64:
    case Constants.TableType.Double:
    case Constants.CassandraType.Bigint:
    case Constants.CassandraType.Decimal:
    case Constants.CassandraType.Double:
    case Constants.CassandraType.Float:
    case Constants.CassandraType.Int:
    case Constants.CassandraType.Smallint:
    case Constants.CassandraType.Tinyint:
      return Constants.InputType.Number;
    default:
      return Constants.InputType.Text;
  }
}

export function padLongWithZeros(value: string): string {
  var s = "0000000000000000000" + value;
  return s.substr(s.length - 20);
}

/**
 * Set a data type for each header. The data type is inferred from entities.
 * Notice: Not every header will have a data type since some headers don't even exist in entities.
 */
export function getDataTypesFromEntities(headers: string[], entities: Entities.ITableEntity[]): any {
  var currentHeaders: string[] = _.clone(headers);
  var dataTypes: any = {};
  entities = entities || [];
  entities.forEach((entity: Entities.ITableEntity, index: number) => {
    if (currentHeaders.length) {
      var keys: string[] = _.keys(entity);
      var headersToProcess: string[] = _.intersection(currentHeaders, keys);
      headersToProcess &&
        headersToProcess.forEach((propertyName: string) => {
          dataTypes[propertyName] = entity[propertyName].$ || Constants.TableType.String;
        });
      currentHeaders = _.difference(currentHeaders, headersToProcess);
    }
  });
  return dataTypes;
}

/**
 * Set a data type for each header. The data type is inferred from Cassandra Schema.
 */
export function getDataTypesFromCassandraSchema(schema: CassandraTableKey[]): any {
  var dataTypes: any = {};
  schema &&
    schema.forEach((schemaItem: CassandraTableKey, index: number) => {
      dataTypes[schemaItem.property] = schemaItem.type;
    });
  return dataTypes;
}
