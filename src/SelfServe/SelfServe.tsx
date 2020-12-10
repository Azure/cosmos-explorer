import "bootstrap/dist/css/bootstrap.css";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import React from "react";
import * as ReactDOM from "react-dom";
import { initializeConfiguration } from "../ConfigContext";
import { Descriptor, SmartUiComponent } from "../Explorer/Controls/SmartUi/SmartUiComponent";
import { getSelfServeType, SelfServeTypes } from "./SelfServeUtils";
import { SqlX } from "./SqlX/SqlX";

const getDescriptor = (selfServeType : SelfServeTypes) : Descriptor => {
  switch (selfServeType) {
    case SelfServeTypes.sqlx:
      return SqlX.toSmartUiDescriptor()
    default:
      return undefined;
  }
}

const render = async () => {
  initializeIcons();
  await initializeConfiguration();
  const selfServeType = getSelfServeType(window.location.search)
  const smartUiDescriptor = getDescriptor(selfServeType)

  const element = smartUiDescriptor ?
    <SmartUiComponent descriptor={smartUiDescriptor} /> :
    <h1>Invalid self serve type!</h1>

  ReactDOM.render(element, document.getElementById("selfServeContent"));
};

// Entry point
window.addEventListener("load", render);
