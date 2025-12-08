import { initializeIcons } from "@fluentui/react";
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import "jest-canvas-mock";
import enableHooks from "jest-react-hooks-shallow";
import { TextDecoder, TextEncoder } from "util";
configure({ adapter: new Adapter() });
initializeIcons();

if (typeof window.URL.createObjectURL === "undefined") {
  Object.defineProperty(window.URL, "createObjectURL", { value: () => {} });
}

enableHooks(jest, { dontMockByDefault: true });

const localStorageMock = (function () {
  let store: { [key: string]: string } = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function (key: string) {
      delete store[key];
    },
    clear: function () {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// TODO Remove when jquery and documentdbclient SDK are removed
(<any>window).$ = (<any>window).jQuery = require("jquery");
(<any>global).$ = (<any>global).$.jQuery = require("jquery");
require("jquery-ui-dist/jquery-ui");
(<any>global).TextEncoder = TextEncoder;
(<any>global).TextDecoder = TextDecoder;

(<any>global).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// The test environment Data Explorer uses does not have crypto.subtle implementation
(<any>global).crypto.subtle = {};

// Mock Performance API for scenario monitoring
const performanceMock = {
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByName: jest.fn().mockReturnValue([]),
  getEntriesByType: jest.fn().mockReturnValue([]),
  now: jest.fn().mockReturnValue(Date.now()),
  ...(<any>global).performance,
};
(<any>global).performance = performanceMock;
(<any>window).performance = performanceMock;
