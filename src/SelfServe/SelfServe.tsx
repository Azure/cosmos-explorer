import "bootstrap/dist/css/bootstrap.css";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import React from "react";
import * as ReactDOM from "react-dom";
import { initializeConfiguration } from "../ConfigContext";
import { SmartUiComponent } from "../Explorer/Controls/SmartUi/SmartUiComponent";
import { SqlX } from "./SqlX/SqlX";

const render = async () => {
  initializeIcons();
  await initializeConfiguration();

  const element = (
    <SmartUiComponent descriptor={SqlX.toSmartUiDescriptor()} />
  );

  ReactDOM.render(element, document.getElementById("selfServeContent"));
};

// Entry point
window.addEventListener("load", render);
