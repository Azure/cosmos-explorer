import { Spinner, SpinnerSize } from "@fluentui/react";
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
// initializeIcons();

const loadTranslationFile = async (className: string): Promise<void> => {
  const language = i18n.languages[0];
  const fileName = `${className}.json`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let translations: any;
  try {
    translations = await import(
      /* webpackChunkName: "Localization-[request]" */ `../Localization/${language}/${fileName}`
    );
  } catch (e) {
    translations = await import(/* webpackChunkName: "Localization-en-[request]" */ `../Localization/en/${fileName}`);
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
      const selfServeExample = new SelfServeExample.default();
      await loadTranslations(selfServeExample.constructor.name);
      return selfServeExample.toSelfServeDescriptor();
    }
    case SelfServeType.sqlx: {
      const SqlX = await import(/* webpackChunkName: "SqlX" */ "./SqlX/SqlX");
      const sqlX = new SqlX.default();
      await loadTranslations(sqlX.constructor.name);
      return sqlX.toSelfServeDescriptor();
    }
    case SelfServeType.graphapicompute: {
      const GraphAPICompute = await import(
        /* webpackChunkName: "GraphAPICompute" */ "./GraphAPICompute/GraphAPICompute"
      );
      const graphAPICompute = new GraphAPICompute.default();
      await loadTranslations(graphAPICompute.constructor.name);
      return graphAPICompute.toSelfServeDescriptor();
    }
    case SelfServeType.materializedviewsbuilder: {
      const MaterializedViewsBuilder = await import(
        /* webpackChunkName: "MaterializedViewsBuilder" */ "./MaterializedViewsBuilder/MaterializedViewsBuilder"
      );
      const materializedViewsBuilder = new MaterializedViewsBuilder.default();
      await loadTranslations(materializedViewsBuilder.constructor.name);
      return materializedViewsBuilder.toSelfServeDescriptor();
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
  const selfServeTypeText = urlSearchParams.get("selfServeType") || inputs.selfServeType;
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
    CATALOG_API_KEY: inputs.catalogAPIKey,
  });

  updateUserContext({
    authorizationToken: inputs.authorizationToken,
    databaseAccount: inputs.databaseAccount,
    resourceGroup: inputs.resourceGroup,
    subscriptionId: inputs.subscriptionId,
  });

  if (i18n.isInitialized) {
    await displaySelfServeComponent(selfServeType);
  } else {
    i18n.on("initialized", async () => {
      await displaySelfServeComponent(selfServeType);
    });
  }
};

const displaySelfServeComponent = async (selfServeType: SelfServeType): Promise<void> => {
  const descriptor = await getDescriptor(selfServeType);
  ReactDOM.render(renderComponent(descriptor), document.getElementById("selfServeContent"));
};

ReactDOM.render(renderSpinner(), document.getElementById("selfServeContent"));
window.addEventListener("message", handleMessage, false);
sendReadyMessage();
