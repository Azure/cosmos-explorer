// Manages all the redux logic for the notebook nteract code
// TODO: Merge with NotebookClient?
// Vendor modules
import {
  actions,
  AppState,
  ContentRecord,
  createHostRef,
  createKernelspecsRef,
  HostRecord,
  HostRef,
  IContentProvider,
  KernelspecsRef,
  makeAppRecord,
  makeCommsRecord,
  makeContentsRecord,
  makeEditorsRecord,
  makeEntitiesRecord,
  makeHostsRecord,
  makeJupyterHostRecord,
  makeStateRecord,
  makeTransformsRecord,
} from "@nteract/core";
import { configOption, defineConfigOption } from "@nteract/mythic-configuration";
import { Media } from "@nteract/outputs";
import TransformVDOM from "@nteract/transform-vdom";
import * as Immutable from "immutable";
import { Notification } from "react-notification-system";
import { AnyAction, Dispatch, Middleware, MiddlewareAPI, Store } from "redux";
import * as Constants from "../../Common/Constants";
import { NotebookWorkspaceConnectionInfo } from "../../Contracts/DataModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import configureStore from "./NotebookComponent/store";
import { CdbAppState, makeCdbRecord } from "./NotebookComponent/types";

export type KernelSpecsDisplay = { name: string; displayName: string };

export interface NotebookClientV2Parameters {
  connectionInfo: NotebookWorkspaceConnectionInfo;
  databaseAccountName: string;
  defaultExperience: string;
  isReadOnly?: boolean; // if true: do not fetch kernelspecs automatically (this is for notebook viewer)
  cellEditorType?: string; // override "codemirror" default,
  autoSaveInterval?: number; // in ms
  contentProvider: IContentProvider;
}

export type ActionListener = (newValue: any) => void;

export class NotebookClientV2 {
  private store: Store<AppState, AnyAction>;
  private contentHostRef: HostRef;
  private kernelSpecsForDisplay: KernelSpecsDisplay[] = [];
  private kernelSpecsRef: KernelspecsRef;

  private databaseAccountName: string;
  private defaultExperience: string;

  constructor(params: NotebookClientV2Parameters) {
    this.databaseAccountName = params.databaseAccountName;
    this.defaultExperience = params.defaultExperience;

    this.configureStore(params);

    this.kernelSpecsRef = createKernelspecsRef();

    // Fetch kernel specs when opening new tab
    if (!params.isReadOnly) {
      this.getStore().dispatch(
        actions.fetchKernelspecs({
          hostRef: this.contentHostRef,
          kernelspecsRef: this.kernelSpecsRef,
        }),
      );
    }
  }

  public getAvailableKernelSpecs(): KernelSpecsDisplay[] {
    return this.kernelSpecsForDisplay;
  }

  public getStore(): Store<AppState, AnyAction> {
    return this.store;
  }

  /**
   * Lazy init redux store as singleton.
   * Don't move store in Explorer yet as it is typed to AppState which is nteract-specific
   */
  private configureStore(params: NotebookClientV2Parameters): void {
    const jupyterHostRecord = makeJupyterHostRecord({
      id: null,
      type: "jupyter",
      defaultKernelName: "python",
      token: params.connectionInfo.authToken,
      origin: params.connectionInfo.notebookServerEndpoint,
      basePath: "/", // Jupyter server base URL
      bookstoreEnabled: false, //!!config.bookstore.version,
      showHeaderEditor: true,
      crossDomain: true,
    });

    this.contentHostRef = createHostRef();
    const NullTransform = (): any => null;
    const kernelspecsRef = createKernelspecsRef();

    const initialState: CdbAppState = {
      app: makeAppRecord({
        version: "dataExplorer 1.0",
        host: jupyterHostRecord,
        // TODO: tamitta: notificationSystem.addNotification was removed, do we need a substitute?
      }),
      core: makeStateRecord({
        currentKernelspecsRef: kernelspecsRef,
        entities: makeEntitiesRecord({
          editors: makeEditorsRecord({}),
          hosts: makeHostsRecord({
            byRef: Immutable.Map<string, HostRecord>().set(this.contentHostRef, jupyterHostRecord),
          }),
          comms: makeCommsRecord(),
          contents: makeContentsRecord({
            byRef: Immutable.Map<string, ContentRecord>(),
          }),
          transforms: userContext.features.sandboxNotebookOutputs
            ? undefined
            : makeTransformsRecord({
                displayOrder: Immutable.List([
                  "application/vnd.jupyter.widget-view+json",
                  "application/vnd.vega.v5+json",
                  "application/vnd.vega.v4+json",
                  "application/vnd.vega.v3+json",
                  "application/vnd.vega.v2+json",
                  "application/vnd.vegalite.v3+json",
                  "application/vnd.vegalite.v2+json",
                  "application/vnd.vegalite.v1+json",
                  "application/geo+json",
                  "application/vnd.plotly.v1+json",
                  "text/vnd.plotly.v1+html",
                  "application/x-nteract-model-debug+json",
                  "application/vnd.dataresource+json",
                  "application/vdom.v1+json",
                  "application/json",
                  "application/javascript",
                  "text/html",
                  "text/markdown",
                  "text/latex",
                  "image/svg+xml",
                  "image/gif",
                  "image/png",
                  "image/jpeg",
                  "text/plain",
                ]),
                byId: Immutable.Map({
                  "text/vnd.plotly.v1+html": NullTransform,
                  "application/vnd.plotly.v1+json": NullTransform,
                  "application/geo+json": NullTransform,
                  "application/x-nteract-model-debug+json": NullTransform,
                  "application/vnd.dataresource+json": NullTransform,
                  "application/vnd.jupyter.widget-view+json": NullTransform,
                  "application/vnd.vegalite.v1+json": NullTransform,
                  "application/vnd.vegalite.v2+json": NullTransform,
                  "application/vnd.vegalite.v3+json": NullTransform,
                  "application/vnd.vega.v2+json": NullTransform,
                  "application/vnd.vega.v3+json": NullTransform,
                  "application/vnd.vega.v4+json": NullTransform,
                  "application/vnd.vega.v5+json": NullTransform,
                  "application/vdom.v1+json": TransformVDOM,
                  "application/json": Media.Json,
                  "application/javascript": Media.JavaScript,
                  "text/html": Media.HTML,
                  "text/markdown": Media.Markdown,
                  "text/latex": Media.LaTeX,
                  "image/svg+xml": Media.SVG,
                  "image/gif": Media.Image,
                  "image/png": Media.Image,
                  "image/jpeg": Media.Image,
                  "text/plain": Media.Plain,
                }),
              }),
        }),
      }),
      cdb: makeCdbRecord({
        databaseAccountName: params.databaseAccountName,
        defaultExperience: params.defaultExperience,
      }),
    };

    /**
     * Intercept kernelspecs updates actions rather than subscribing to the store state changes (which
     * is triggered for *any* state change).
     * TODO: Use react-redux connect() to subscribe to state changes?
     */
    const cacheKernelSpecsMiddleware: Middleware =
      <D extends Dispatch<AnyAction>, S extends AppState>({ dispatch, getState }: MiddlewareAPI<D, S>) =>
      (next: Dispatch<AnyAction>) =>
      <A extends AnyAction>(action: A): A => {
        switch (action.type) {
          case actions.FETCH_KERNELSPECS_FULFILLED: {
            const payload = (action as unknown as actions.FetchKernelspecsFulfilled).payload;
            const defaultKernelName = payload.defaultKernelName;
            this.kernelSpecsForDisplay = Object.values(payload.kernelspecs)
              .filter((spec) => !spec.metadata?.hasOwnProperty("hidden"))
              .map((spec) => ({
                name: spec.name,
                displayName: spec.displayName,
              }))
              .sort((a: KernelSpecsDisplay, b: KernelSpecsDisplay) => {
                // Put default at the top, otherwise lexicographically compare
                if (a.displayName === defaultKernelName) {
                  return -1;
                } else if (b.name === defaultKernelName) {
                  return 1;
                } else {
                  return a.displayName.localeCompare(b.displayName);
                }
              });
            break;
          }
        }

        return next(action);
      };

    const traceErrorFct = (title: string, message: string) => {
      TelemetryProcessor.traceFailure(Action.NotebookErrorNotification, {
        dataExplorerArea: Constants.Areas.Notebook,
        title,
        message,
        level: "Error",
      });
      console.error(`${title}: ${message}`);
    };

    this.store = configureStore(
      initialState,
      params.contentProvider,
      traceErrorFct,
      [cacheKernelSpecsMiddleware],
      !params.isReadOnly,
    );

    // Additional configuration
    this.store.dispatch(configOption("editorType").action(params.cellEditorType ?? "codemirror"));
    this.store.dispatch(
      configOption("autoSaveInterval").action(params.autoSaveInterval ?? Constants.Notebook.autoSaveIntervalMs),
    );
    this.store.dispatch(configOption("codeMirror.lineNumbers").action(true));

    const readOnlyConfigOption = configOption("codeMirror.readOnly");
    const readOnlyValue = params.isReadOnly ? "nocursor" : undefined;
    if (!readOnlyConfigOption) {
      defineConfigOption({
        label: "Read-only",
        key: "codeMirror.readOnly",
        values: [
          { label: "Read-Only", value: "nocursor" },
          { label: "Not read-only", value: undefined },
        ],
        defaultValue: readOnlyValue,
      });
    } else {
      this.store.dispatch(readOnlyConfigOption.action(readOnlyValue));
    }
  }

  /**
   * Handle notification coming from nteract
   * The messages coming from nteract are not good enough to expose to user.
   * We use the notificationsToUserEpic to control the messages from action.
   * We log possible errors coming from nteract in telemetry and display in console
   */
  private handleNotification = (msg: Notification): void => {
    if (msg.level === "error") {
      TelemetryProcessor.traceFailure(Action.NotebookErrorNotification, {
        dataExplorerArea: Constants.Areas.Notebook,
        title: msg.title,
        message: msg.message,
        level: msg.level,
      });
      console.error(`${msg.title}: ${msg.message}`);
    } else {
      console.log(`${msg.title}: ${msg.message}`);
    }
  };
}
