import { initializeIcons } from "@fluentui/react";
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import "jest-canvas-mock";
import { TextDecoder, TextEncoder } from "util";
configure({ adapter: new Adapter() });
initializeIcons();

if (typeof window.URL.createObjectURL === "undefined") {
  Object.defineProperty(window.URL, "createObjectURL", { value: () => {} });
}

// TODO Remove when jquery and documentdbclient SDK are removed
(<any>window).$ = (<any>window).jQuery = require("jquery");
(<any>global).$ = (<any>global).$.jQuery = require("jquery");
require("jquery-ui-dist/jquery-ui");
(<any>global).TextEncoder = TextEncoder;
(<any>global).TextDecoder = TextDecoder;

// In Node v7 unhandled promise rejections
if (process.env.LISTENING_TO_UNHANDLED_REJECTION !== "true") {
  process.on("unhandledRejection", (reason) => {
    console.error("reason", reason);
  });
  // Avoid memory leak by adding too many listeners
  process.env.LISTENING_TO_UNHANDLED_REJECTION = "true";
}
