"use strict";
exports.__esModule = true;
exports.HashMap = void 0;
/**
 * Simple hashmap implementation that doesn't rely on ES6 Map nor polyfills
 */
var HashMap = /** @class */ (function () {
    function HashMap(container) {
        if (container === void 0) { container = {}; }
        this.container = container;
    }
    HashMap.prototype.has = function (key) {
        return this.container.hasOwnProperty(key);
    };
    HashMap.prototype.set = function (key, value) {
        this.container[key] = value;
    };
    HashMap.prototype.get = function (key) {
        return this.container[key];
    };
    HashMap.prototype.size = function () {
        return Object.keys(this.container).length;
    };
    HashMap.prototype["delete"] = function (key) {
        if (this.has(key)) {
            delete this.container[key];
            return true;
        }
        return false;
    };
    HashMap.prototype.clear = function () {
        this.container = {};
    };
    HashMap.prototype.keys = function () {
        return Object.keys(this.container);
    };
    HashMap.prototype.forEach = function (iteratorFct) {
        for (var k in this.container) {
            iteratorFct(k, this.container[k]);
        }
    };
    return HashMap;
}());
exports.HashMap = HashMap;
