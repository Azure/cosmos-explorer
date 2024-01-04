/* Type definitions for code-runner's jquery-typeahead v2.8.0
 * https://github.com/running-coder/jquery-typeahead
 *
 * There is no DefinitelyTyped support for this library, yet, so we only define here what we use.
 * https://github.com/running-coder/jquery-typeahead/issues/156
 * TODO: Replace this minimum definition by the official one when it comes out.
 */
/// <reference types="jquery" />

interface JQueryTypeaheadParam {
  input: string;
  order?: string;
  source: any;
  callback?: any;
  minLength?: number;
  searchOnFocus?: boolean;
  template?: string | { (query: string, item: any): string };
  dynamic?: boolean;
  mustSelectItem?: boolean;
}

/**
 * For use with: $.typeahead()
 */
interface JQueryStatic {
  typeahead(arg: JQueryTypeaheadParam): void;
}

/**
 * For use with $('').typehead()
 */
// interface JQuery {
//     typeahead(arg: JQueryTypeaheadParam): void;
// }
