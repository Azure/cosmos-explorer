/* 
d3-shape depends on a global type CanvasPathMethods in lib.dom.d.ts, but this was renamed
to CanvasPath in TS 3.1. This file aliases the new type to the old type name to make
d3-shape happy. 
See: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/27776
And: https://github.com/Microsoft/TSJS-lib-generator/issues/548
*/

type CanvasPathMethods = CanvasPath;
