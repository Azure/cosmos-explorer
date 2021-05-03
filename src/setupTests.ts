import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { configure } from "enzyme";
import "jest-canvas-mock";
import { initializeIcons } from "office-ui-fabric-react";
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
