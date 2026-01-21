export const Int32 = {
  Min: -2147483648,
  Max: 2147483647,
};

export const Int64 = {
  Min: -9223372036854775808,
  Max: 9223372036854775807,
};

const yearMonthDay = "\\d{4}[- ][01]\\d[- ][0-3]\\d";
const timeOfDay = "T[0-2]\\d:[0-5]\\d(:[0-5]\\d(\\.\\d+)?)?";
const timeZone = "Z|[+-][0-2]\\d:[0-5]\\d";

export const ValidationRegExp = {
  Guid: /^[{(]?[0-9A-F]{8}[-]?([0-9A-F]{4}[-]?){3}[0-9A-F]{12}[)}]?$/i,
  Float: /^[+-]?\d+(\.\d+)?(e[+-]?\d+)?$/i,
  // OData seems to require an "L" suffix for Int64 values, yet Azure Storage errors out with it. See http://www.odata.org/documentation/odata-version-2-0/overview/
  Integer: /^[+-]?\d+$/i, // Used for both Int32 and Int64 values
  Boolean: /^"?(true|false)"?$/i,
  DateTime: new RegExp(`^${yearMonthDay}${timeOfDay}${timeZone}$`),
  // eslint-disable-next-line no-control-regex
  PrimaryKey: /^[^/\\#?\u0000-\u001F\u007F-\u009F]*$/,
};
