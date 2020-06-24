// CSS Dependencies
import "bootstrap/dist/css/bootstrap.css";
import "../less/documentDB.less";
import "../less/tree.less";
import "../less/forms.less";
import "../less/menus.less";
import "../less/infobox.less";
import "../less/messagebox.less";
import "./Explorer/Controls/ErrorDisplayComponent/ErrorDisplayComponent.less";
import "./Explorer/Menus/NotificationConsole/NotificationConsole.less";
import "./Explorer/Menus/CommandBar/CommandBarComponent.less";
import "./Explorer/Menus/CommandBar/MemoryTrackerComponent.less";
import "./Explorer/Controls/CollapsiblePanel/CollapsiblePanelComponent.less";
import "./Explorer/Controls/DynamicList/DynamicListComponent.less";
import "./Explorer/Controls/JsonEditor/JsonEditorComponent.less";
import "./Explorer/Graph/GraphExplorerComponent/graphExplorer.less";
import "../less/TableStyles/queryBuilder.less";
import "../externals/jquery.dataTables.min.css";
import "../less/TableStyles/fulldatatables.less";
import "../externals/jquery.contextMenu.css";
import "../less/TableStyles/EntityEditor.less";
import "../less/TableStyles/CustomizeColumns.less";
import "../less/resourceTree.less";
import "../externals/jquery.typeahead.min.css";
import "../externals/jquery-ui.min.css";
import "../externals/jquery-ui.structure.min.css";
import "../externals/jquery-ui.theme.min.css";
import "./Explorer/Graph/NewVertexComponent/newVertexComponent.less";
import "./Explorer/Panes/GraphNewVertexPane.less";
import "./Explorer/Tabs/QueryTab.less";
import "./Explorer/Controls/TreeComponent/treeComponent.less";
import "./Explorer/Controls/Accordion/AccordionComponent.less";
import "./Explorer/SplashScreen/SplashScreenComponent.less";
import "./Explorer/Controls/Notebook/NotebookTerminalComponent.less";
import "./Explorer/Controls/Spark/ClusterSettingsComponent.less";

// Image Dependencies
import "../images/CosmosDB_rgb_ui_lighttheme.ico";
import "../images/favicon.ico";

import "./Shared/appInsights";
import "babel-polyfill";
import "es6-symbol/implement";
import "webcrypto-liner/build/webcrypto-liner.shim.min";
import "./Libs/jquery";
import "bootstrap/dist/js/npm";
import "../externals/jquery.contextMenu.js";
import "../externals/jquery.typeahead.min.js";
import "../externals/jquery-ui.min.js";
import "../externals/adal.js";
import "promise-polyfill/src/polyfill";
import "abort-controller/polyfill";
import "whatwg-fetch";
import "es6-object-assign/auto";
import "promise.prototype.finally/auto";
import "object.entries/auto";
import "./Libs/is-integer-polyfill";
import "url-polyfill/url-polyfill.min";

// TODO: Enable ReactDevTools after fixing the portal CORS issue
// import "./ReactDevTools"

import * as ko from "knockout";
import TelemetryProcessor from "./Shared/Telemetry/TelemetryProcessor";
import * as ViewModels from "./Contracts/ViewModels";
import { Action, ActionModifiers } from "./Shared/Telemetry/TelemetryConstants";

import { BindingHandlersRegisterer } from "./Bindings/BindingHandlersRegisterer";
import * as Emulator from "./Platform/Emulator/Main";
import Hosted from "./Platform/Hosted/Main";
import * as Portal from "./Platform/Portal/Main";
import { PlatformType } from "./PlatformType";
import { AuthType } from "./AuthType";

import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import { applyExplorerBindings } from "./applyExplorerBindings";
import { initializeConfiguration, Platform } from "./Config";

initializeIcons(/* optional base url */);

// TODO: Encapsulate and reuse all global variables as environment variables
window.authType = AuthType.AAD;

initializeConfiguration().then(config => {
  if (config.platform === Platform.Hosted) {
    try {
      // TODO Remove. All window variables should move to src/Config file
      window.dataExplorerPlatform = PlatformType.Hosted;
      Hosted.initializeExplorer().then(
        (explorer: ViewModels.Explorer) => {
          applyExplorerBindings(explorer);
          Hosted.configureTokenValidationDisplayPrompt(explorer);
        },
        (error: any) => {
          try {
            const uninitializedExplorer: ViewModels.Explorer = Hosted.getUninitializedExplorerForGuestAccess();
            window.dataExplorer = uninitializedExplorer;
            ko.applyBindings(uninitializedExplorer);
            BindingHandlersRegisterer.registerBindingHandlers();
            if (window.authType !== AuthType.AAD) {
              uninitializedExplorer.isRefreshingExplorer(false);
              uninitializedExplorer.displayConnectExplorerForm();
            }
          } catch (e) {
            console.log(e);
          }
          console.error(error);
        }
      );
    } catch (e) {
      console.log(e);
    }
  } else if (config.platform === Platform.Emulator) {
    // TODO Remove. All window variables should move to src/Config file
    window.dataExplorerPlatform = PlatformType.Emulator;
    window.authType = AuthType.MasterKey;
    const explorer = Emulator.initializeExplorer();
    applyExplorerBindings(explorer);
  } else if (config.platform === Platform.Portal) {
    // TODO Remove. All window variables should move to src/Config file
    window.dataExplorerPlatform = PlatformType.Portal;
    TelemetryProcessor.trace(Action.InitializeDataExplorer, ActionModifiers.Open, {});
    const explorer = Portal.initializeExplorer();
    TelemetryProcessor.trace(Action.InitializeDataExplorer, ActionModifiers.IFrameReady, {});
    applyExplorerBindings(explorer);
  }
});
