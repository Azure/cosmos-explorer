import {
  AppState,
  ContentRef,
  JupyterHostRecordProps,
  ServerConfig as JupyterServerConfig,
  KernelInfo,
  KernelRef,
  RemoteKernelProps,
  actions,
  castToSessionId,
  createKernelRef,
  selectors,
} from "@nteract/core";
import { Channels, childOf, createMessage, message, ofMessageType } from "@nteract/messaging";
import { defineConfigOption } from "@nteract/mythic-configuration";
import { RecordOf } from "immutable";
import { Action, AnyAction } from "redux";
import { StateObservable, ofType } from "redux-observable";
import { kernels, sessions } from "rx-jupyter";
import { EMPTY, Observable, Observer, Subject, Subscriber, concat, from, interval, merge, of, timer } from "rxjs";
import {
  catchError,
  concatMap,
  delayWhen,
  filter,
  first,
  map,
  mergeMap,
  retryWhen,
  switchMap,
  take,
  tap,
  timeout,
} from "rxjs/operators";
import { webSocket } from "rxjs/webSocket";
import * as Constants from "../../../Common/Constants";
import { Areas } from "../../../Common/Constants";
import { ActionModifiers, Action as TelemetryAction } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { logConsoleError, logConsoleInfo } from "../../../Utils/NotificationConsoleUtils";
import { useTabs } from "../../../hooks/useTabs";
import { useDialog } from "../../Controls/Dialog";
import * as FileSystemUtil from "../FileSystemUtil";
import * as cdbActions from "../NotebookComponent/actions";
import { NotebookContentProviderType, NotebookUtil } from "../NotebookUtil";
import * as CdbActions from "./actions";
import * as TextFile from "./contents/file/text-file";
import { CdbAppState, JupyterMessage } from "./types";

interface NotebookServiceConfig extends JupyterServerConfig {
  userPuid?: string;
}

const logFailureToTelemetry = (state: CdbAppState, title: string, error?: string) => {
  TelemetryProcessor.traceFailure(TelemetryAction.NotebookErrorNotification, {
    dataExplorerArea: Constants.Areas.Notebook,
    title,
    error,
  });
};

/**
 * Automatically add a new cell if notebook is empty
 * @param action$
 * @param state$
 */
const addInitialCodeCellEpic = (
  action$: Observable<actions.FetchContentFulfilled>,
  state$: StateObservable<AppState>,
): Observable<{} | actions.CreateCellBelow> => {
  return action$.pipe(
    ofType(actions.FETCH_CONTENT_FULFILLED),
    mergeMap((action) => {
      const state = state$.value;
      const contentRef = action.payload.contentRef;
      const model = selectors.model(state, { contentRef });

      // If it's not a notebook, we shouldn't be here
      if (!model || model.type !== "notebook") {
        return EMPTY;
      }

      const cellOrder = selectors.notebook.cellOrder(model);
      if (cellOrder.size === 0) {
        return of(
          actions.createCellAppend({
            cellType: "code",
            contentRef,
          }),
        );
      }

      return EMPTY;
    }),
  );
};

/**
 * Updated kernels.formWebSocketURL so we pass the userId as a query param
 */
const formWebSocketURL = (serverConfig: NotebookServiceConfig, kernelId: string, sessionId?: string): string => {
  const params = new URLSearchParams();
  if (sessionId) {
    params.append("session_id", sessionId);
  }
  const q = params.toString();
  const suffix = q !== "" ? `?${q}` : "";
  const url = (serverConfig.endpoint.slice(0, -1) || "") + `api/kernels/${kernelId}/channels${suffix}`;

  return url.replace(/^http(s)?/, "ws$1");
};

/**
 * Override from kernel-lifecycle to improve code mirror language intellisense
 * @param action$
 */
export const acquireKernelInfoEpic = (action$: Observable<actions.NewKernelAction>) => {
  return action$.pipe(
    ofType(actions.LAUNCH_KERNEL_SUCCESSFUL),
    switchMap((action: actions.NewKernelAction) => {
      const {
        payload: {
          kernel: { channels },
          kernelRef,
          contentRef,
        },
      } = action;
      return acquireKernelInfo(channels, kernelRef, contentRef);
    }),
  );
};

/**
 * Send a kernel_info_request to the kernel and derive code mirror mode based on the language name.
 */
function acquireKernelInfo(channels: Channels, kernelRef: KernelRef, contentRef: ContentRef) {
  const message = createMessage("kernel_info_request");

  const obs = channels.pipe(
    childOf(message),
    ofMessageType("kernel_info_reply"),
    first(),
    mergeMap((msg) => {
      const content = msg.content;
      const languageInfo = (content && content.language_info) || {
        name: "",
        version: "",
        mimetype: "",
        file_extension: "",
        pygments_lexer: "",
        codemirror_mode: "",
        nbconvert_exporter: "",
      };

      switch (languageInfo.name) {
        case "csharp":
          languageInfo.codemirror_mode = "text/x-csharp";
          break;
        case "scala":
          languageInfo.codemirror_mode = "text/x-scala";
          break;
      }

      const info: KernelInfo = {
        protocolVersion: content.protocol_version,
        implementation: content.implementation,
        implementationVersion: content.implementation_version,
        banner: content.banner,
        helpLinks: content.help_links,
        languageName: languageInfo.name,
        languageVersion: languageInfo.version,
        mimetype: languageInfo.mimetype,
        fileExtension: languageInfo.file_extension,
        pygmentsLexer: languageInfo.pygments_lexer,
        codemirrorMode: languageInfo.codemirror_mode,
        nbconvertExporter: languageInfo.nbconvert_exporter,
      };

      let result;
      if (!content.protocol_version.startsWith("5")) {
        result = [
          actions.launchKernelFailed({
            kernelRef,
            contentRef,
            error: new Error(
              "The kernel that you are attempting to launch does not support the latest version (v5) of the messaging protocol.",
            ),
          }),
        ];
      } else {
        result = [
          // The original action we were using
          actions.setLanguageInfo({
            langInfo: msg.content.language_info,
            kernelRef,
            contentRef,
          }),
          actions.setKernelInfo({
            kernelRef,
            info,
          }),
        ];
      }

      return of(...result);
    }),
  );

  return Observable.create((observer: Observer<any>) => {
    const subscription = obs.subscribe(observer);
    channels.next(message);
    return subscription;
  });
}

/**
 * Updated kernels.connect so we use the updated formWebSocketURL to pass
 * the userId as a query param
 * @param serverConfig
 * @param kernelID
 * @param sessionID
 */
const connect = (serverConfig: NotebookServiceConfig, kernelID: string, sessionID?: string): Subject<any> => {
  const wsSubject = webSocket<JupyterMessage>({
    url: formWebSocketURL(serverConfig, kernelID, sessionID),
    protocol: serverConfig.wsProtocol,
  });

  // Create a subject that does some of the handling inline for the session
  // and ensuring it's serialized
  return Subject.create(
    Subscriber.create(
      (message?: JupyterMessage) => {
        if (typeof message === "object") {
          const sessionizedMessage = {
            ...message,
            header: {
              session: sessionID,
              token: serverConfig.token,
              ...message.header,
            },
          };
          wsSubject.next(sessionizedMessage);
        } else {
          console.error("Message must be an object, the app sent", message);
        }
      },
      (e: Error) => wsSubject.error(e),
      () => wsSubject.complete(),
    ), // Subscriber
    // Subject.create takes a subscriber and an observable. We're only
    // overriding the subscriber here so we pass the subject on as an
    // observable as the second argument to Subject.create (since it's
    // _also_ an observable)
    wsSubject,
  );
};

/**
 * Override launch websocket kernel epic:
 * - pass the userId
 * - if kernelspecs are present in the state:
 *    * verify that the kernel name matches one of the kernelspecs
 *    * else attempt to pick a kernel that matches the name from the kernelspecs list
 *    * else pick the default kernel specs
 * @param action$
 * @param state$
 */
export const launchWebSocketKernelEpic = (
  action$: Observable<actions.LaunchKernelByNameAction>,
  state$: StateObservable<CdbAppState>,
) => {
  return action$.pipe(
    ofType(actions.LAUNCH_KERNEL_BY_NAME),
    // Only accept jupyter servers for the host with this epic
    filter(() => selectors.isCurrentHostJupyter(state$.value)),
    switchMap((action: actions.LaunchKernelByNameAction) => {
      const state = state$.value;
      const host = selectors.currentHost(state);
      if (host.type !== "jupyter") {
        return EMPTY;
      }
      const serverConfig: NotebookServiceConfig = selectors.serverConfig(host);

      const {
        payload: { kernelSpecName, cwd, kernelRef, contentRef },
      } = action;

      const content = selectors.content(state, { contentRef });
      if (!content || content.type !== "notebook") {
        return EMPTY;
      }

      let kernelSpecToLaunch = kernelSpecName;

      const currentKernelspecs = selectors.currentKernelspecs(state$.value);

      if (!kernelSpecToLaunch) {
        if (currentKernelspecs) {
          kernelSpecToLaunch = currentKernelspecs.defaultKernelName;
          const msg = `No kernelspec name specified to launch, using default kernel: ${kernelSpecToLaunch}`;
          logConsoleInfo(msg);
          logFailureToTelemetry(state$.value, "Launching alternate kernel", msg);
        } else {
          return of(
            actions.launchKernelFailed({
              error: new Error(
                "Unable to launch kernel: no kernelspec name specified to launch and no default kernelspecs",
              ),
              contentRef,
            }),
          );
        }
      } else if (currentKernelspecs && !currentKernelspecs.byName.get(kernelSpecToLaunch)) {
        let msg = `Cannot launch kernelspec: "${kernelSpecToLaunch}" is not supported by the notebook server.`;

        // Find a kernel that best matches the kernel name
        const match = currentKernelspecs.byName.find(
          (value) => value.name.toLowerCase().indexOf(kernelSpecName.toLowerCase()) !== -1,
        );
        if (match) {
          kernelSpecToLaunch = match.name;
          msg += ` Found kernel with similar name: ${kernelSpecToLaunch}`;
        } else {
          kernelSpecToLaunch = currentKernelspecs.defaultKernelName;
          msg += ` Using default kernel: ${kernelSpecToLaunch}`;
        }
        logConsoleInfo(msg);
        logFailureToTelemetry(state$.value, "Launching alternate kernel", msg);
      }

      const sessionPayload = {
        kernel: {
          id: null,
          name: kernelSpecToLaunch,
        } as any,
        name: "",
        path: content.filepath.replace(/^\/+/g, ""),
        type: "notebook",
      };

      return sessions.create(serverConfig, sessionPayload).pipe(
        mergeMap((data) => {
          const session = data.response;

          const sessionId = castToSessionId(session.id);

          const kernel: RemoteKernelProps = Object.assign({}, session.kernel, {
            type: "websocket",
            info: null,
            sessionId,
            cwd,
            channels: connect(serverConfig, session.kernel.id, sessionId),
            kernelSpecName: kernelSpecToLaunch,
          });

          kernel.channels.next(message({ msg_type: "kernel_info_request" }));

          return of(
            actions.launchKernelSuccessful({
              kernel,
              kernelRef,
              contentRef: action.payload.contentRef,
              selectNextKernel: true,
            }),
          );
        }),
        catchError((error) => {
          return of(actions.launchKernelFailed({ error }));
        }),
      );
    }),
  );
};
/**
 * Override the restartWebSocketKernelEpic from nteract since the /restart endpoint of our kernels has not
 * been implmemented;
 * TODO: Remove this epic once the /restart endpoint is implemented.
 */
export const restartWebSocketKernelEpic = (
  action$: Observable<actions.RestartKernel | actions.NewKernelAction>,
  state$: StateObservable<AppState>,
) =>
  action$.pipe(
    ofType(actions.RESTART_KERNEL),
    concatMap((action: actions.RestartKernel) => {
      const state = state$.value;

      const contentRef = action.payload.contentRef;
      const kernelRef = selectors.kernelRefByContentRef(state, { contentRef }) || action.payload.kernelRef;

      /**
       * If there is still no KernelRef, then throw an error.
       */
      if (!kernelRef) {
        return of(
          actions.restartKernelFailed({
            error: new Error("Can't execute restart without kernel ref."),
            kernelRef: "none provided",
            contentRef,
          }),
        );
      }

      const host = selectors.currentHost(state);
      if (host.type !== "jupyter") {
        return of(
          actions.restartKernelFailed({
            error: new Error("Can't restart a kernel with no Jupyter host."),
            kernelRef,
            contentRef,
          }),
        );
      }

      const kernel = selectors.kernel(state, { kernelRef });
      if (!kernel) {
        return of(
          actions.restartKernelFailed({
            error: new Error("Can't restart a kernel that does not exist."),
            kernelRef,
            contentRef,
          }),
        );
      }

      if (kernel.type !== "websocket" || !kernel.id) {
        return of(
          actions.restartKernelFailed({
            error: new Error("Can only restart Websocket kernels via API."),
            kernelRef,
            contentRef,
          }),
        );
      }

      const newKernelRef = createKernelRef();
      const kill = actions.killKernel({
        restarting: true,
        kernelRef,
      });

      const relaunch = actions.launchKernelByName({
        kernelSpecName: kernel.kernelSpecName ?? undefined,
        cwd: kernel.cwd,
        kernelRef: newKernelRef,
        selectNextKernel: true,
        contentRef: contentRef,
      });

      const awaitKernelReady = action$.pipe(
        ofType(actions.LAUNCH_KERNEL_SUCCESSFUL),
        filter((action: actions.NewKernelAction | actions.RestartKernel) => action.payload.kernelRef === newKernelRef),
        take(1),
        timeout(60000), // If kernel doesn't come up within this interval we will abort follow-on actions.
        concatMap(() => {
          const restartSuccess = actions.restartKernelSuccessful({
            kernelRef: newKernelRef,
            contentRef,
          });

          if ((action as actions.RestartKernel).payload.outputHandling === "Run All") {
            return of(restartSuccess, actions.executeAllCells({ contentRef }));
          } else {
            return of(restartSuccess);
          }
        }),
        catchError((error) => {
          return of(
            actions.restartKernelFailed({
              error,
              kernelRef: newKernelRef,
              contentRef,
            }),
          );
        }),
      );

      return merge(of(kill, relaunch), awaitKernelReady);
    }),
  );

/**
 * Override changeWebSocketKernelEpic:
 * - to pass the userId when connecting to the kernel.
 * - to override extractNewKernel()
 * @param action$
 * @param state$
 */
const changeWebSocketKernelEpic = (
  action$: Observable<actions.ChangeKernelByName>,
  state$: StateObservable<AppState>,
) => {
  return action$.pipe(
    ofType(actions.CHANGE_KERNEL_BY_NAME),
    // Only accept jupyter servers for the host with this epic
    filter(() => selectors.isCurrentHostJupyter(state$.value)),
    switchMap((action: actions.ChangeKernelByName) => {
      const {
        payload: { contentRef, oldKernelRef, kernelSpecName },
      } = action;
      const state = state$.value;
      const host = selectors.currentHost(state);
      if (host.type !== "jupyter") {
        return EMPTY;
      }

      const serverConfig: NotebookServiceConfig = selectors.serverConfig(host);
      if (!oldKernelRef) {
        return EMPTY;
      }

      const oldKernel = selectors.kernel(state, { kernelRef: oldKernelRef });
      if (!oldKernel || oldKernel.type !== "websocket") {
        return EMPTY;
      }
      const { sessionId } = oldKernel;
      if (!sessionId) {
        return EMPTY;
      }

      const content = selectors.content(state, { contentRef });
      if (!content || content.type !== "notebook") {
        return EMPTY;
      }
      const {
        filepath,
        model: { notebook },
      } = content;
      const { cwd } = NotebookUtil.extractNewKernel(filepath, notebook);

      const kernelRef = createKernelRef();
      return kernels.start(serverConfig, kernelSpecName, cwd).pipe(
        mergeMap(({ response }) => {
          const { id: kernelId } = response;
          const sessionPayload = {
            kernel: { id: kernelId, name: kernelSpecName },
          };
          // The sessions API will close down the old kernel for us if it is on this session
          return sessions.update(serverConfig, sessionId, sessionPayload).pipe(
            mergeMap(({ response: session }) => {
              const kernel: RemoteKernelProps = Object.assign({}, session.kernel, {
                type: "websocket",
                sessionId,
                cwd,
                channels: connect(serverConfig, session.kernel.id, sessionId),
                kernelSpecName,
              });
              return of(
                actions.launchKernelSuccessful({
                  kernel,
                  kernelRef,
                  contentRef: action.payload.contentRef,
                  selectNextKernel: true,
                }),
              );
            }),
            catchError((error) => of(actions.launchKernelFailed({ error, kernelRef, contentRef }))),
          );
        }),
        catchError((error) => of(actions.launchKernelFailed({ error, kernelRef, contentRef }))),
      );
    }),
  );
};

/**
 * Automatically focus on cell if only one cell
 * @param action$
 * @param state$
 */
const focusInitialCodeCellEpic = (
  action$: Observable<actions.CreateCellAppend>,
  state$: StateObservable<AppState>,
): Observable<{} | actions.FocusCell> => {
  return action$.pipe(
    ofType(actions.CREATE_CELL_APPEND),
    mergeMap((action) => {
      const state = state$.value;
      const contentRef = action.payload.contentRef;
      const model = selectors.model(state, { contentRef });

      // If it's not a notebook, we shouldn't be here
      if (!model || model.type !== "notebook") {
        return EMPTY;
      }

      const cellOrder = selectors.notebook.cellOrder(model);
      if (cellOrder.size === 1) {
        const id = cellOrder.get(0);
        // Focus on the cell
        return of(
          actions.focusCell({
            id,
            contentRef,
          }),
        );
      }

      return EMPTY;
    }),
  );
};

/**
 * Capture some actions to display to notification console
 * TODO: Log these (or everything) in telemetry?
 * @param action$
 * @param state$
 */
const notificationsToUserEpic = (action$: Observable<any>, state$: StateObservable<CdbAppState>): Observable<{}> => {
  return action$.pipe(
    ofType(
      actions.RESTART_KERNEL_SUCCESSFUL,
      actions.RESTART_KERNEL_FAILED,
      actions.SAVE_FULFILLED,
      actions.SAVE_FAILED,
      actions.FETCH_CONTENT_FAILED,
    ),
    mergeMap((action) => {
      switch (action.type) {
        case actions.RESTART_KERNEL_SUCCESSFUL: {
          const title = "Kernel restart";
          const msg = "Kernel successfully restarted";
          logConsoleInfo(msg);
          logFailureToTelemetry(state$.value, title, msg);
          break;
        }
        case actions.RESTART_KERNEL_FAILED:
          // TODO: enable once incorrect kernel restart failure signals are fixed
          // NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, "Failed to restart kernel");
          break;
        case actions.SAVE_FAILED: {
          const title = "Save failure";
          const msg = `Failed to save notebook: ${(action as actions.SaveFailed).payload.error}`;
          logConsoleError(msg);
          logFailureToTelemetry(state$.value, title, msg);
          break;
        }
        case actions.FETCH_CONTENT_FAILED: {
          const typedAction: actions.FetchContentFailed = action;
          const filepath = selectors.filepath(state$.value, { contentRef: typedAction.payload.contentRef });
          const title = "Fetching content failure";
          const msg = `Failed to fetch notebook content: ${filepath}, error: ${typedAction.payload.error}`;
          logConsoleError(msg);
          logFailureToTelemetry(state$.value, title, msg);
          break;
        }
      }
      return EMPTY;
    }),
  );
};

/**
 * Connection lost: ping server until back up and restart kernel
 * @param action$
 * @param state$
 */
const handleKernelConnectionLostEpic = (
  action$: Observable<actions.UpdateDisplayFailed>,
  state$: StateObservable<CdbAppState>,
): Observable<CdbActions.UpdateKernelRestartDelayAction | actions.RestartKernel | {}> => {
  return action$.pipe(
    ofType(actions.UPDATE_DISPLAY_FAILED),
    mergeMap((action) => {
      const state = state$.value;

      const msg = "Notebook was disconnected from kernel";
      logConsoleError(msg);
      logFailureToTelemetry(state, "Error", "Kernel connection error");

      const host = selectors.currentHost(state);
      const serverConfig: NotebookServiceConfig = selectors.serverConfig(host as RecordOf<JupyterHostRecordProps>);

      const contentRef = action.payload.contentRef;
      const kernelRef = selectors.kernelRefByContentRef(state$.value, { contentRef });

      const delayMs = state.cdb.kernelRestartDelayMs;
      if (delayMs > Constants.Notebook.kernelRestartMaxDelayMs) {
        const msg =
          "Restarted kernel too many times. Please reload the page to enable Data Explorer to restart the kernel automatically.";
        logConsoleError(msg);
        logFailureToTelemetry(state, "Kernel restart error", msg);

        useDialog.getState().showOkModalDialog("kernel restarts", msg);

        return of(EMPTY);
      }

      return concat(
        of(CdbActions.UpdateKernelRestartDelay({ delayMs: delayMs * 1.5 })),
        sessions.list(serverConfig).pipe(
          delayWhen(() => timer(delayMs)),
          map((xhr) => {
            return actions.restartKernel({
              outputHandling: "None",
              kernelRef,
              contentRef,
            });
          }),
          retryWhen((errors) => {
            return errors.pipe(
              delayWhen(() => timer(Constants.Notebook.heartbeatDelayMs)),
              tap(() => console.log("retrying...")), // TODO: Send new action?
            );
          }),
        ),
      );
    }),
  );
};

/**
 * Connection lost: clean up kernel ref
 * @param action$
 * @param state$
 */
export const cleanKernelOnConnectionLostEpic = (
  action$: Observable<actions.UpdateDisplayFailed>,
  state$: StateObservable<AppState>,
): Observable<actions.KillKernelSuccessful> => {
  return action$.pipe(
    ofType(actions.UPDATE_DISPLAY_FAILED),
    switchMap((action) => {
      const contentRef = action.payload.contentRef;
      const kernelRef = selectors.kernelRefByContentRef(state$.value, { contentRef });
      return of(
        actions.killKernelSuccessful({
          kernelRef,
        }),
      );
    }),
  );
};

/**
 * Execute focused cell and focus next cell
 * @param action$
 * @param state$
 */
const executeFocusedCellAndFocusNextEpic = (
  action$: Observable<CdbActions.ExecuteFocusedCellAndFocusNextAction>,
  state$: StateObservable<AppState>,
): Observable<{} | actions.FocusNextCellEditor> => {
  return action$.pipe(
    ofType(CdbActions.EXECUTE_FOCUSED_CELL_AND_FOCUS_NEXT),
    mergeMap((action) => {
      const contentRef = action.payload.contentRef;
      return concat(
        of(actions.executeFocusedCell({ contentRef })),
        of(actions.focusNextCell({ contentRef, createCellIfUndefined: false })),
      );
    }),
  );
};

/**
 * Close tab if mimetype not supported
 * @param action$
 * @param state$
 */
const closeUnsupportedMimetypesEpic = (
  action$: Observable<actions.FetchContentFulfilled>,
  state$: StateObservable<AppState>,
): Observable<{}> => {
  return action$.pipe(
    ofType(actions.FETCH_CONTENT_FULFILLED),
    mergeMap((action) => {
      const mimetype = action.payload.model.mimetype;
      if (!TextFile.handles(mimetype)) {
        const filepath = action.payload.filepath;
        // Close tab and show error message
        useTabs
          .getState()
          .closeTabsByComparator(
            (tab: any) =>
              (tab as any).notebookPath && FileSystemUtil.isPathEqual((tab as any).notebookPath(), filepath),
          );
        const msg = `${filepath} cannot be rendered. Please download the file, in order to view it outside of Data Explorer.`;
        useDialog.getState().showOkModalDialog("File cannot be rendered", msg);
        logConsoleError(msg);
      }
      return EMPTY;
    }),
  );
};

/**
 * Close tab if file content fails to fetch not supported
 * @param action$
 * @param state$
 */
const closeContentFailedToFetchEpic = (
  action$: Observable<actions.FetchContentFailed>,
  state$: StateObservable<AppState>,
): Observable<{}> => {
  return action$.pipe(
    ofType(actions.FETCH_CONTENT_FAILED),
    mergeMap((action) => {
      const filepath = action.payload.filepath;
      // Close tab and show error message
      useTabs
        .getState()
        .closeTabsByComparator(
          (tab: any) => (tab as any).notebookPath && FileSystemUtil.isPathEqual((tab as any).notebookPath(), filepath),
        );
      const msg = `Failed to load file: ${filepath}.`;
      useDialog.getState().showOkModalDialog("Failure to load", msg);
      logConsoleError(msg);
      return EMPTY;
    }),
  );
};

const traceNotebookTelemetryEpic = (
  action$: Observable<cdbActions.TraceNotebookTelemetryAction>,
  state$: StateObservable<CdbAppState>,
): Observable<{}> => {
  return action$.pipe(
    ofType(cdbActions.TRACE_NOTEBOOK_TELEMETRY),
    mergeMap((action: cdbActions.TraceNotebookTelemetryAction) => {
      const state = state$.value;

      TelemetryProcessor.trace(action.payload.action, action.payload.actionModifier, {
        ...action.payload.data,
        databaseAccountName: state.cdb.databaseAccountName,
        defaultExperience: state.cdb.defaultExperience,
        dataExplorerArea: Areas.Notebook,
      });
      return EMPTY;
    }),
  );
};

/**
 * Log notebook information to telemetry
 * # raw cells, # markdown cells, # code cells, total
 * @param action$
 * @param state$
 */
const traceNotebookInfoEpic = (
  action$: Observable<actions.FetchContentFulfilled>,
  state$: StateObservable<AppState>,
): Observable<{} | cdbActions.TraceNotebookTelemetryAction> => {
  return action$.pipe(
    ofType(actions.FETCH_CONTENT_FULFILLED),
    mergeMap((action: { payload: any }) => {
      const state = state$.value;
      const contentRef = action.payload.contentRef;
      const model = selectors.model(state, { contentRef });

      // If it's not a notebook, we shouldn't be here
      if (!model || model.type !== "notebook") {
        return EMPTY;
      }

      const dataToLog = {
        nbCodeCells: 0,
        nbRawCells: 0,
        nbMarkdownCells: 0,
        nbCells: 0,
      };
      for (let [id, cell] of selectors.notebook.cellMap(model)) {
        switch (cell.cell_type) {
          case "code":
            dataToLog.nbCodeCells++;
            break;
          case "markdown":
            dataToLog.nbMarkdownCells++;
            break;
          case "raw":
            dataToLog.nbRawCells++;
            break;
        }
        dataToLog.nbCells++;
      }

      return of(
        cdbActions.traceNotebookTelemetry({
          action: TelemetryAction.NotebooksFetched,
          actionModifier: ActionModifiers.Mark,
          data: dataToLog,
        }),
      );
    }),
  );
};

/**
 * Log Kernel spec to start
 * @param action$
 * @param state$
 */
const traceNotebookKernelEpic = (
  action$: Observable<AnyAction>,
  state$: StateObservable<AppState>,
): Observable<cdbActions.TraceNotebookTelemetryAction> => {
  return action$.pipe(
    ofType(actions.LAUNCH_KERNEL_SUCCESSFUL),
    mergeMap((action: { payload: any; type: string }) => {
      return of(
        cdbActions.traceNotebookTelemetry({
          action: TelemetryAction.NotebooksKernelSpecName,
          actionModifier: ActionModifiers.Mark,
          data: {
            kernelSpecName: action.payload.kernel.name,
          },
        }),
      );
    }),
  );
};

const resetCellStatusOnExecuteCanceledEpic = (
  action$: Observable<actions.ExecuteCanceled>,
  state$: StateObservable<AppState>,
): Observable<actions.UpdateCellStatus> => {
  return action$.pipe(
    ofType(actions.EXECUTE_CANCELED),
    mergeMap((action) => {
      const contentRef = action.payload.contentRef;
      const model = state$.value.core.entities.contents.byRef.get(contentRef).model;
      let busyCellIds: string[] = [];

      if (model.type === "notebook") {
        const cellMap = model.transient.get("cellMap");
        if (cellMap) {
          for (const entry of cellMap.toArray()) {
            const cellId = entry[0];
            const status = model.transient.getIn(["cellMap", cellId, "status"]);
            if (status === "busy") {
              busyCellIds.push(cellId);
            }
          }
        }
      }

      return from(busyCellIds).pipe(
        map((busyCellId) => {
          return actions.updateCellStatus({ id: busyCellId, contentRef, status: undefined });
        }),
      );
    }),
  );
};

const { selector: autoSaveInterval } = defineConfigOption({
  key: "autoSaveInterval",
  label: "Auto-save interval",
  defaultValue: 120_000,
});

/**
 * Override autoSaveCurrentContentEpic to disable auto save for notebooks under temporary workspace.
 * @param action$
 */
export function autoSaveCurrentContentEpic(
  action$: Observable<Action>,
  state$: StateObservable<AppState>,
): Observable<actions.Save> {
  return state$.pipe(
    map((state) => autoSaveInterval(state)),
    switchMap((time) => interval(time)),
    mergeMap(() => {
      const state = state$.value;
      return from(
        selectors
          .contentByRef(state)
          .filter(
            /*
             * Only save contents that are files or notebooks with
             * a filepath already set.
             */
            (content) => (content.type === "file" || content.type === "notebook") && content.filepath !== "",
          )
          .keys(),
      );
    }),
    filter((contentRef: ContentRef) => {
      const model = selectors.model(state$.value, { contentRef });
      const content = selectors.content(state$.value, { contentRef });
      if (
        model &&
        model.type === "notebook" &&
        NotebookUtil.getContentProviderType(content.filepath) !== NotebookContentProviderType.JupyterContentProviderType
      ) {
        return selectors.notebook.isDirty(model);
      }
      return false;
    }),
    map((contentRef: ContentRef) => actions.save({ contentRef })),
  );
}

export const allEpics = [
  addInitialCodeCellEpic,
  focusInitialCodeCellEpic,
  notificationsToUserEpic,
  launchWebSocketKernelEpic,
  changeWebSocketKernelEpic,
  acquireKernelInfoEpic,
  handleKernelConnectionLostEpic,
  cleanKernelOnConnectionLostEpic,
  executeFocusedCellAndFocusNextEpic,
  closeUnsupportedMimetypesEpic,
  closeContentFailedToFetchEpic,
  restartWebSocketKernelEpic,
  traceNotebookTelemetryEpic,
  traceNotebookInfoEpic,
  traceNotebookKernelEpic,
  resetCellStatusOnExecuteCanceledEpic,
  autoSaveCurrentContentEpic,
];
