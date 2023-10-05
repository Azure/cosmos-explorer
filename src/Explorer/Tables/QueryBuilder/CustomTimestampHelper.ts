import QueryBuilderViewModel from "./QueryBuilderViewModel";
import QueryClauseViewModel from "./QueryClauseViewModel";
import * as DateTimeUtilities from "./DateTimeUtilities";

/**
 * Constants
 */
export var utc = "utc";
export var local = "local";

export interface ITimestampQuery {
  queryType: string; // valid values are "last" and "range"
  lastNumber: number; // number value of a custom timestamp using the last option
  lastTimeUnit: string; // timeunit of a custom timestamp using the last option
  startTime: string;
  endTime: string;
  timeZone: string; // timezone of custom range timestamp, valid values are "local" and "utc"
}

export interface ILastQuery {
  lastNumber: number;
  lastTimeUnit: string;
}

export enum TimeUnit {
  Seconds,
  Minutes,
  Hours,
  Days,
}

/**
 * Setting helpers
 */

export function addRangeTimestamp(
  timestamp: ITimestampQuery,
  queryBuilderViewModel: QueryBuilderViewModel,
  queryClauseViewModel: QueryClauseViewModel,
): void {
  queryBuilderViewModel.addCustomRange(timestamp, queryClauseViewModel);
}

export function getDefaultStart(localTime: boolean, durationHours: number = 24): string {
  var startTimestamp: string;

  var utcNowString: string = new Date().toISOString();
  var yesterday: Date = new Date(utcNowString);

  yesterday.setHours(yesterday.getHours() - durationHours);
  startTimestamp = yesterday.toISOString();

  if (localTime) {
    startTimestamp = localFromUtcDateString(startTimestamp);
  }

  return startTimestamp;
}

export function getDefaultEnd(localTime: boolean): string {
  var endTimestamp: string;

  var utcNowString: string = new Date().toISOString();

  endTimestamp = utcNowString;

  if (localTime) {
    endTimestamp = localFromUtcDateString(endTimestamp);
  }

  return endTimestamp;
}

export function parseDate(dateString: string, isUTC: boolean): Date {
  // TODO validate dateString
  var date: Date = null;

  if (dateString) {
    try {
      // Date string is assumed to be UTC in Storage Explorer Standalone.
      // Behavior may vary in other browsers.
      // Here's an example of how the string looks like "2015-10-24T21:44:12"
      var millisecondTime = Date.parse(dateString),
        parsed: Date = new Date(millisecondTime);

      if (isUTC) {
        date = parsed;
      } else {
        // Since we parsed in UTC, accessors are flipped - we get local time from the getUTC* group
        // Reinstating, the date is parsed above as UTC, and here we are creating a new date object
        // in local time.
        var year = parsed.getUTCFullYear(),
          month = parsed.getUTCMonth(),
          day = parsed.getUTCDate(),
          hours = parsed.getUTCHours(),
          minutes = parsed.getUTCMinutes(),
          seconds = parsed.getUTCSeconds(),
          milliseconds = parsed.getUTCMilliseconds();

        date = new Date(year, month, day, hours, minutes, seconds, milliseconds);
      }
    } catch (error) {
      //Debug.error("Error parsing date string: ", dateString, error);
    }
  }

  return date;
}

export function utcFromLocalDateString(localDateString: string): string {
  // TODO validate localDateString
  var localDate = parseDate(localDateString, false),
    utcDateString: string = null;

  if (localDate) {
    utcDateString = localDate.toISOString();
  }

  return utcDateString;
}

function padIfNeeded(value: number): string {
  var padded: string = String(value);

  if (0 <= value && value < 10) {
    padded = "0" + padded;
  }

  return padded;
}

function toLocalDateString(date: Date): string {
  var localDateString: string = null;

  if (date) {
    localDateString =
      date.getFullYear() +
      "-" +
      padIfNeeded(date.getMonth() + 1) +
      "-" +
      padIfNeeded(date.getDate()) +
      "T" +
      padIfNeeded(date.getHours()) +
      ":" +
      padIfNeeded(date.getMinutes()) +
      ":" +
      padIfNeeded(date.getSeconds());
  }

  return localDateString;
}

export function localFromUtcDateString(utcDateString: string): string {
  // TODO validate utcDateString
  var utcDate: Date = parseDate(utcDateString, true),
    localDateString: string = null;

  if (utcDate) {
    localDateString = toLocalDateString(utcDate);
  }

  return localDateString;
}

export function tryChangeTimestampTimeZone(koTimestamp: ko.Observable<string>, toUTC: boolean): void {
  if (koTimestamp) {
    var currentDateString: string = koTimestamp(),
      newDateString: string;

    if (currentDateString) {
      if (toUTC) {
        newDateString = utcFromLocalDateString(currentDateString);
        // removing last character because cannot format it to html binding with the 'Z' at the end
        newDateString = newDateString.substring(0, newDateString.length - 1);
      } else {
        newDateString = localFromUtcDateString(currentDateString);
      }

      // utcFromLocalDateString and localFromUtcDateString could return null if currentDateString is invalid.
      // Hence, only set koTimestamp if newDateString is not null.
      if (newDateString) {
        koTimestamp(newDateString);
      }
    }
  }
}

/**
 * Input validation helpers
 */

export var noTooltip = "",
  invalidStartTimeTooltip = "Please provide a valid start time.", // localize
  invalidExpiryTimeRequiredTooltip = "Required field. Please provide a valid expiry time.", // localize
  invalidExpiryTimeGreaterThanStartTimeTooltip = "The expiry time must be greater than the start time."; // localize

export function isDateString(dateString: string): boolean {
  var success: boolean = false;

  if (dateString) {
    var date: number = Date.parse(dateString);

    success = $.isNumeric(date);
  }

  return success;
}

// Is date string and earlier than expiry time; or is empty
// export function isInvalidStartTimeInput(startTimestamp: string, expiryTimestamp: string, isUTC: boolean): DialogsCommon.IValidationResult {
//     var tooltip: string = noTooltip,
//         isValid: boolean = isDateString(startTimestamp),
//         startDate: Date,
//         expiryDate: Date;

//     if (!isValid) {
//         isValid = (startTimestamp === "");
//     }

//     if (!isValid) {
//         tooltip = invalidStartTimeTooltip;
//     }

//     if (isValid && !!startTimestamp && isDateString(expiryTimestamp)) {
//         startDate = parseDate(startTimestamp, isUTC);
//         expiryDate = parseDate(expiryTimestamp, isUTC);

//         isValid = (startDate < expiryDate);

//         if (!isValid) {
//             tooltip = invalidExpiryTimeGreaterThanStartTimeTooltip;
//         }
//     }

//     return { isInvalid: !isValid, help: tooltip };
// }

// Is date string, and later than start time (if any)
// export function isInvalidExpiryTimeInput(startTimestamp: string, expiryTimestamp: string, isUTC: boolean): DialogsCommon.IValidationResult {
//     var isValid: boolean = isDateString(expiryTimestamp),
//         tooltip: string = isValid ? noTooltip : invalidExpiryTimeRequiredTooltip,
//         startDate: Date,
//         expiryDate: Date;

//     if (isValid && startTimestamp) {
//         if (isDateString(startTimestamp)) {
//             startDate = parseDate(startTimestamp, isUTC);
//             expiryDate = parseDate(expiryTimestamp, isUTC);
//             isValid = (startDate < expiryDate);

//             if (!isValid) {
//                 tooltip = invalidExpiryTimeGreaterThanStartTimeTooltip;
//             }
//         }
//     }

//     return { isInvalid: !isValid, help: tooltip };
// }

/**
 * Functions to calculate DateTime Strings
 */

function _getLocalIsoDateTimeString(time: Date): string {
  // yyyy-mm-ddThh:mm:ss.sss
  // Not using the timezone offset (or 'Z'), which will make the
  // date/time represent local time by default.
  // var formatted = _string.sprintf(
  //     "%sT%02d:%02d:%02d.%03d",
  //     _getLocalIsoDateString(time),
  //     time.getHours(),
  //     time.getMinutes(),
  //     time.getSeconds(),
  //     time.getMilliseconds()
  // );
  // return formatted;
  return (
    _getLocalIsoDateString(time) +
    "T" +
    DateTimeUtilities.ensureDoubleDigits(time.getHours()) +
    ":" +
    DateTimeUtilities.ensureDoubleDigits(time.getMinutes()) +
    ":" +
    DateTimeUtilities.ensureDoubleDigits(time.getSeconds()) +
    "." +
    DateTimeUtilities.ensureTripleDigits(time.getMilliseconds())
  );
}

function _getLocalIsoDateString(date: Date): string {
  return _getLocalIsoDateStringFromParts(date.getFullYear(), date.getMonth(), date.getDate());
}

function _getLocalIsoDateStringFromParts(
  fullYear: number,
  month: number /* 0..11 */,
  date: number /* 1..31 */,
): string {
  month = month + 1;
  return (
    fullYear + "-" + DateTimeUtilities.ensureDoubleDigits(month) + "-" + DateTimeUtilities.ensureDoubleDigits(date)
  );
  // return _string.sprintf(
  //     "%04d-%02d-%02d",
  //     fullYear,
  //     month + 1, // JS month is 0..11
  //     date);     // but date is 1..31
}

function _addDaysHours(time: Date, days: number, hours: number): Date {
  var msPerHour = 1000 * 60 * 60;
  var daysMs = days * msPerHour * 24;
  var hoursMs = hours * msPerHour;
  var newTimeMs = time.getTime() + daysMs + hoursMs;
  return new Date(newTimeMs);
}

function _daysHoursBeforeNow(days: number, hours: number): Date {
  return _addDaysHours(new Date(), -days, -hours);
}

export function _queryLastDaysHours(days: number, hours: number): string {
  /* tslint:disable: no-unused-variable */
  var daysHoursAgo = _getLocalIsoDateTimeString(_daysHoursBeforeNow(days, hours));
  daysHoursAgo = DateTimeUtilities.getUTCDateTime(daysHoursAgo);

  return daysHoursAgo;
  /* tslint:enable: no-unused-variable */
}

export function _queryCurrentMonthLocal(): string {
  var now = new Date();
  var start = _getLocalIsoDateStringFromParts(now.getFullYear(), now.getMonth(), 1);
  start = DateTimeUtilities.getUTCDateTime(start);
  return start;
}

export function _queryCurrentYearLocal(): string {
  var now = new Date();
  var start = _getLocalIsoDateStringFromParts(now.getFullYear(), 0, 1); // Month is 0..11, date is 1..31
  start = DateTimeUtilities.getUTCDateTime(start);
  return start;
}

function _addTime(time: Date, lastNumber: number, timeUnit: string): Date {
  var timeMS: number;
  switch (TimeUnit[Number(timeUnit)]) {
    case TimeUnit.Days.toString():
      timeMS = lastNumber * 1000 * 60 * 60 * 24;
      break;
    case TimeUnit.Hours.toString():
      timeMS = lastNumber * 1000 * 60 * 60;
      break;
    case TimeUnit.Minutes.toString():
      timeMS = lastNumber * 1000 * 60;
      break;
    case TimeUnit.Seconds.toString():
      timeMS = lastNumber * 1000;
      break;
    default:
    //throw new Errors.ArgumentOutOfRangeError(timeUnit);
  }
  var newTimeMS = time.getTime() + timeMS;
  return new Date(newTimeMS);
}

function _timeBeforeNow(lastNumber: number, timeUnit: string): Date {
  return _addTime(new Date(), -lastNumber, timeUnit);
}

export function _queryLastTime(lastNumber: number, timeUnit: string): string {
  /* tslint:disable: no-unused-variable */
  var daysHoursAgo = _getLocalIsoDateTimeString(_timeBeforeNow(lastNumber, timeUnit));
  daysHoursAgo = DateTimeUtilities.getUTCDateTime(daysHoursAgo);
  return daysHoursAgo;
  /* tslint:enable: no-unused-variable */
}
