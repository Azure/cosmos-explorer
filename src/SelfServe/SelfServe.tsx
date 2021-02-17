import * as React from "react";
import ReactDOM from "react-dom";
import { sendMessage } from "../Common/MessageHandler";
import { isInvalidParentFrameOrigin } from "../Utils/MessageValidation";
import { SelfServeComponent } from "./SelfServeComponent";
import { SelfServeDescriptor } from "./SelfServeTypes";
import { SelfServeType } from "./SelfServeUtils";
import { SelfServeFrameInputs } from "../Contracts/ViewModels";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import { configContext, updateConfigContext } from "../ConfigContext";
import { normalizeArmEndpoint } from "../Common/EnvironmentUtility";
import { updateUserContext } from "../UserContext";
import "./SelfServe.less";
initializeIcons();

const getDescriptor = async (selfServeType: SelfServeType): Promise<SelfServeDescriptor> => {
  switch (selfServeType) {
    case SelfServeType.example: {
      const SelfServeExample = await import(/* webpackChunkName: "SelfServeExample" */ "./Example/SelfServeExample");
      return new SelfServeExample.default().toSelfServeDescriptor();
    }
    case SelfServeType.sqlx: {
      const SqlX = await import(/* webpackChunkName: "SqlX" */ "./SqlX/SqlX");
      return new SqlX.default().toSelfServeDescriptor();
    }
    default:
      return undefined;
  }
};

const renderComponent = (selfServeDescriptor: SelfServeDescriptor): JSX.Element => {
  if (!selfServeDescriptor) {
    return <h1>Invalid self serve type!</h1>;
  }
  return <SelfServeComponent descriptor={selfServeDescriptor} />;
};

const handleMessage = async (event: MessageEvent): Promise<void> => {
  if (isInvalidParentFrameOrigin(event)) {
    return;
  }

  if (event.data["signature"] !== "pcIframe") {
    return;
  }

  if (typeof event.data !== "object") {
    return;
  }

  const inputs = event.data.data.inputs as SelfServeFrameInputs;
  if (!inputs) {
    return;
  }

  const urlSearchParams = new URLSearchParams(window.location.search);
  const selfServeTypeText = inputs.selfServeType || urlSearchParams.get("selfServeType");
  const selfServeType = SelfServeType[selfServeTypeText?.toLowerCase() as keyof typeof SelfServeType];
  if (
    !inputs.subscriptionId ||
    !inputs.resourceGroup ||
    !inputs.databaseAccount ||
    !inputs.authorizationToken ||
    !inputs.csmEndpoint ||
    !selfServeType
  ) {
    return;
  }

  updateConfigContext({
    ARM_ENDPOINT: normalizeArmEndpoint(inputs.csmEndpoint || configContext.ARM_ENDPOINT),
  });

  updateUserContext({
    authorizationToken: inputs.authorizationToken,
    databaseAccount: inputs.databaseAccount,
    resourceGroup: inputs.resourceGroup,
    subscriptionId: inputs.subscriptionId,
  });

  const descriptor = await getDescriptor(selfServeType);
  ReactDOM.render(renderComponent(descriptor), document.getElementById("selfServeContent"));
};

window.addEventListener("message", handleMessage, false);
sendMessage("ready");
