/*    Copyright 2013 10gen Inc.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

export default class MongoUtility {
  public static tojson = function (x: any, indent: string, nolint: boolean) {
    if (x === null || x === undefined) {
      return String(x);
    }
    indent = indent || "";

    switch (typeof x) {
      case "string":
        var out = new Array(x.length + 1);
        out[0] = '"';
        for (var i = 0; i < x.length; i++) {
          if (x[i] === '"') {
            out[out.length] = '\\"';
          } else if (x[i] === "\\") {
            out[out.length] = "\\\\";
          } else if (x[i] === "\b") {
            out[out.length] = "\\b";
          } else if (x[i] === "\f") {
            out[out.length] = "\\f";
          } else if (x[i] === "\n") {
            out[out.length] = "\\n";
          } else if (x[i] === "\r") {
            out[out.length] = "\\r";
          } else if (x[i] === "\t") {
            out[out.length] = "\\t";
          } else {
            var code = x.charCodeAt(i);
            if (code < 0x20) {
              out[out.length] = (code < 0x10 ? "\\u000" : "\\u00") + code.toString(16);
            } else {
              out[out.length] = x[i];
            }
          }
        }
        return out.join("") + '"';
      case "number":
      /* falls through */
      case "boolean":
        return "" + x;
      case "object":
        var func = $.isArray(x) ? MongoUtility.tojsonArray : MongoUtility.tojsonObject;
        var s = func(x, indent, nolint);
        if (
          (nolint === null || nolint === undefined || nolint === true) &&
          s.length < 80 &&
          (indent === null || indent.length === 0)
        ) {
          s = s.replace(/[\t\r\n]+/gm, " ");
        }
        return s;
      case "function":
        return x.toString();
      default:
        throw new Error("tojson can't handle type " + typeof x);
    }
  };

  private static tojsonObject = function (x: any, indent: string, nolint: boolean) {
    var lineEnding = nolint ? " " : "\n";
    var tabSpace = nolint ? "" : "\t";
    indent = indent || "";

    if (typeof x.tojson === "function" && x.tojson !== MongoUtility.tojson) {
      return x.tojson(indent, nolint);
    }

    if (x.constructor && typeof x.constructor.tojson === "function" && x.constructor.tojson !== MongoUtility.tojson) {
      return x.constructor.tojson(x, indent, nolint);
    }

    if (MongoUtility.hasDefinedProperty(x, "toString") && !$.isArray(x)) {
      return x.toString();
    }

    if (x instanceof Error) {
      return x.toString();
    }

    if (MongoUtility.isObjectId(x)) {
      return 'ObjectId("' + x.$oid + '")';
    }

    // push one level of indent
    indent += tabSpace;
    var s = "{";

    var pairs = [];
    for (var k in x) {
      if (x.hasOwnProperty(k)) {
        var val = x[k];
        var pair = '"' + k + '" : ' + MongoUtility.tojson(val, indent, nolint);

        if (k === "_id") {
          pairs.unshift(pair);
        } else {
          pairs.push(pair);
        }
      }
    }
    // Add proper line endings, indents, and commas to each line
    s += $.map(pairs, function (pair) {
      return lineEnding + indent + pair;
    }).join(",");
    s += lineEnding;

    // pop one level of indent
    indent = indent.substring(1);
    return s + indent + "}";
  };

  private static tojsonArray = function (a: any, indent: string, nolint: boolean) {
    if (a.length === 0) {
      return "[ ]";
    }

    var lineEnding = nolint ? " " : "\n";
    if (!indent || nolint) {
      indent = "";
    }

    var s = "[" + lineEnding;
    indent += "\t";
    for (var i = 0; i < a.length; i++) {
      s += indent + MongoUtility.tojson(a[i], indent, nolint);
      if (i < a.length - 1) {
        s += "," + lineEnding;
      }
    }
    if (a.length === 0) {
      s += indent;
    }

    indent = indent.substring(1);
    s += lineEnding + indent + "]";
    return s;
  };

  private static hasDefinedProperty = function (obj: any, prop: string): boolean {
    if (Object.getPrototypeOf === undefined || Object.getPrototypeOf(obj) === null) {
      return false;
    } else if (obj.hasOwnProperty(prop)) {
      return true;
    } else {
      return MongoUtility.hasDefinedProperty(Object.getPrototypeOf(obj), prop);
    }
  };

  private static isObjectId(obj: any): boolean {
    var keys = Object.keys(obj);
    return keys.length === 1 && keys[0] === "$oid" && typeof obj.$oid === "string" && /^[0-9a-f]{24}$/.test(obj.$oid);
  }
}
