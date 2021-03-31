import { Spinner, SpinnerSize } from "office-ui-fabric-react";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import * as React from "react";
import ReactDOM from "react-dom";
import { withTranslation } from "react-i18next";
import { normalizeArmEndpoint } from "../Common/EnvironmentUtility";
import { sendReadyMessage } from "../Common/MessageHandler";
import { configContext, updateConfigContext } from "../ConfigContext";
import { SelfServeFrameInputs } from "../Contracts/ViewModels";
import i18n from "../i18n";
import { updateUserContext } from "../UserContext";
import { isInvalidParentFrameOrigin } from "../Utils/MessageValidation";
import "./SelfServe.less";
import { SelfServeComponent } from "./SelfServeComponent";
import { SelfServeDescriptor } from "./SelfServeTypes";
import { SelfServeType } from "./SelfServeUtils";
initializeIcons();

const loadTranslationFile = async (className: string): Promise<void> => {
  const language = i18n.languages[0];
  const fileName = `${className}.json`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let translations: any;
  try {
    translations = await import(`../Localization/${language}/${fileName}`);
  } catch (e) {
    translations = await import(`../Localization/en/${fileName}`);
  }
  i18n.addResourceBundle(language, className, translations.default, true);
};

const loadTranslations = async (className: string): Promise<void> => {
  await loadTranslationFile("Common");
  await loadTranslationFile(className);
};

const getDescriptor = async (selfServeType: SelfServeType): Promise<SelfServeDescriptor> => {
  switch (selfServeType) {
    case SelfServeType.example: {
      const SelfServeExample = await import(/* webpackChunkName: "SelfServeExample" */ "./Example/SelfServeExample");
      await loadTranslations(SelfServeExample.default.name);
      return new SelfServeExample.default().toSelfServeDescriptor();
    }
    case SelfServeType.sqlx: {
      const SqlX = await import(/* webpackChunkName: "SqlX" */ "./SqlX/SqlX");
      await loadTranslations(SqlX.default.name);
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
  const SelfServeComponentTranslated = withTranslation()(SelfServeComponent);
  return <SelfServeComponentTranslated descriptor={selfServeDescriptor} />;
};

const renderSpinner = (): JSX.Element => {
  return <Spinner size={SpinnerSize.large}></Spinner>;
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

ReactDOM.render(renderSpinner(), document.getElementById("selfServeContent"));
window.addEventListener("message", handleMessage, false);
sendReadyMessage();
