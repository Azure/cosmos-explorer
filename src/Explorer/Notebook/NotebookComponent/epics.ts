import { empty, merge, of, timer, concat, Subject, Subscriber, Observable, Observer } from "rxjs";
import { webSocket } from "rxjs/webSocket";
import { ActionsObservable, StateObservable } from "redux-observable";
import { ofType } from "redux-observable";
import {
  mergeMap,
  tap,
  retryWhen,
  delayWhen,
  map,
  switchMap,
  take,
  filter,
  catchError,
  first,
  concatMap,
  timeout
} from "rxjs/operators";
import {
  AppState,
  ServerConfig as JupyterServerConfig,
  JupyterHostRecordProps,
  RemoteKernelProps,
  castToSessionId,
  createKernelRef,
  KernelRef,
  ContentRef,
  KernelInfo,
  actions,
  selectors
} from "@nteract/core";
import { message, JupyterMessage, Channels, createMessage, childOf, ofMessageType } from "@nteract/messaging";
import { sessions, kernels } from "rx-jupyter";
import { RecordOf } from "immutable";

import * as Constants from "../../../Common/Constants";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import { ConsoleDataType } from "../../Menus/NotificationConsole/NotificationConsoleComponent";
import * as CdbActions from "./actions";
import TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { Action as TelemetryAction } from "../../../Shared/Telemetry/TelemetryConstants";
import { CdbAppState } from "./types";
import { decryptJWTToken } from "../../../Utils/AuthorizationUtils";
import * as TextFile from "./contents/file/text-file";
import { NotebookUtil } from "../NotebookUtil";
import { FileSystemUtil } from "../FileSystemUtil";

interface NotebookServiceConfig extends JupyterServerConfig {
  userPuid?: string;
}

const logToTelemetry = (state: CdbAppState, title: string, error?: string) => {
  TelemetryProcessor.traceFailure(TelemetryAction.NotebookErrorNotification, {
    databaseAccountName: state.cdb.databaseAccountName,
    defaultExperience: state.cdb.defaultExperience,
    dataExplorerArea: Constants.Areas.Notebook,
    title,
    error
  });
};

/**
 * Automatically add a new cell if notebook is empty
 * @param action$
 * @param state$
 */
const addInitialCodeCellEpic = (
  action$: ActionsObservable<actions.FetchContentFulfilled>,
  state$: StateObservable<AppState>
): Observable<{} | actions.CreateCellBelow> => {
  return action$.pipe(
    ofType(actions.FETCH_CONTENT_FULFILLED),
    mergeMap(action => {
      const state = state$.value;
      const contentRef = action.payload.contentRef;
      const model = selectors.model(state, { contentRef });

      // If it's not a notebook, we shouldn't be here
      if (!model || model.type !== "notebook") {
        return empty();
      }

      const cellOrder = selectors.notebook.cellOrder(model);
      if (cellOrder.size === 0) {
        return of(
          actions.createCellAppend({
            cellType: "code",
            contentRef
          })
        );
      }

      return empty();
    })
  );
};

/**
 * Automatically start kernel if kernelRef is present.
 * The kernel is normally lazy-started when a cell is being executed, but a running kernel is
 * required for code completion to work.
 * For notebook viewer, there is no kernel
 * @param action$
 * @param state$
 */
export const autoStartKernelEpic = (
  action$: ActionsObservable<actions.FetchContentFulfilled>,
  state$: StateObservable<AppState>
): Observable<{} | actions.CreateCellBelow> => {
  return action$.pipe(
    ofType(actions.FETCH_CONTENT_FULFILLED),
    mergeMap(action => {
      const state = state$.value;
      const { contentRef, kernelRef } = action.payload;

      if (!kernelRef) {
        return empty();
      }

      return of(
        actions.restartKernel({
          contentRef,
          kernelRef,
          outputHandling: "None"
        })
      );
    })
  );
};

/**
 * Updated kernels.formWebSocketURL so we pass the userId as a query param
 */
const formWebSocketURL = (serverConfig: NotebookServiceConfig, kernelId: string, sessionId?: string): string => {
  const params = new URLSearchParams();
  if (serverConfig.token) {
    params.append("token", serverConfig.token);
  }
  if (sessionId) {
    params.append("session_id", sessionId);
  }

  const userId = getUserPuid();
  if (userId) {
    params.append("user_id", userId);
  }

  const q = params.toString();
  const suffix = q !== "" ? `?${q}` : "";

  const url = (serverConfig.endpoint || "") + `api/kernels/${kernelId}/channels${suffix}`;

  return url.replace(/^http(s)?/, "ws$1");
};

/**
 * Override from kernel-lifecycle to improve code mirror language intellisense
 * @param action$
 */
export const acquireKernelInfoEpic = (action$: ActionsObservable<actions.NewKernelAction>) => {
  return action$.pipe(
    ofType(actions.LAUNCH_KERNEL_SUCCESSFUL),
    switchMap((action: actions.NewKernelAction) => {
      const {
        payload: {
          kernel: { channels },
          kernelRef,
          contentRef
        }
      } = action;
      return acquireKernelInfo(channels, kernelRef, contentRef);
    })
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
    mergeMap(msg => {
      const content = msg.content;
      const languageInfo = (content && content.language_info) || {
        name: "",
        version: "",
        mimetype: "",
        file_extension: "",
        pygments_lexer: "",
        codemirror_mode: "",
        nbconvert_exporter: ""
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
        nbconvertExporter: languageInfo.nbconvert_exporter
      };

      let result;
      if (!content.protocol_version.startsWith("5")) {
        result = [
          actions.launchKernelFailed({
            kernelRef,
            contentRef,
            error: new Error(
              "The kernel that you are attempting to launch does not support the latest version (v5) of the messaging protocol."
            )
          })
        ];
      } else {
        result = [
          // The original action we were using
          actions.setLanguageInfo({
            langInfo: msg.content.language_info,
            kernelRef,
            contentRef
          }),
          actions.setKernelInfo({
            kernelRef,
            info
          })
        ];
      }

      return of(...result);
    })
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
    protocol: serverConfig.wsProtocol
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
              ...message.header
            }
          };

          wsSubject.next(sessionizedMessage);
        } else {
          console.error("Message must be an object, the app sent", message);
        }
      },
      (e: Error) => wsSubject.error(e),
      () => wsSubject.complete()
    ), // Subscriber
    // Subject.create takes a subscriber and an observable. We're only
    // overriding the subscriber here so we pass the subject on as an
    // observable as the second argument to Subject.create (since it's
    // _also_ an observable)
    wsSubject
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
  action$: ActionsObservable<actions.LaunchKernelByNameAction>,
  state$: StateObservable<CdbAppState>
) => {
  return action$.pipe(
    ofType(actions.LAUNCH_KERNEL_BY_NAME),
    // Only accept jupyter servers for the host with this epic
    filter(() => selectors.isCurrentHostJupyter(state$.value)),
    switchMap((action: actions.LaunchKernelByNameAction) => {
      const state = state$.value;
      const host = selectors.currentHost(state);
      if (host.type !== "jupyter") {
        return empty();
      }
      const serverConfig: NotebookServiceConfig = selectors.serverConfig(host);
      serverConfig.userPuid = getUserPuid();

      const {
        payload: { kernelSpecName, cwd, kernelRef, contentRef }
      } = action;

      const content = selectors.content(state, { contentRef });
      if (!content || content.type !== "notebook") {
        return empty();
      }

      let kernelSpecToLaunch = kernelSpecName;

      const currentKernelspecs = selectors.currentKernelspecs(state$.value);

      if (!kernelSpecToLaunch) {
        if (currentKernelspecs) {
          kernelSpecToLaunch = currentKernelspecs.defaultKernelName;
          const msg = `No kernelspec name specified to launch, using default kernel: ${kernelSpecToLaunch}`;
          NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, msg);
          logToTelemetry(state$.value, "Launching alternate kernel", msg);
        } else {
          return of(
            actions.launchKernelFailed({
              error: new Error(
                "Unable to launch kernel: no kernelspec name specified to launch and no default kernelspecs"
              ),
              contentRef
            })
          );
        }
      } else if (currentKernelspecs && !currentKernelspecs.byName.get(kernelSpecToLaunch)) {
        let msg = `Cannot launch kernelspec: "${kernelSpecToLaunch}" is not supported by the notebook server.`;

        // Find a kernel that best matches the kernel name
        const match = currentKernelspecs.byName.find(
          value => value.name.toLowerCase().indexOf(kernelSpecName.toLowerCase()) !== -1
        );
        if (match) {
          kernelSpecToLaunch = match.name;
          msg += ` Found kernel with similar name: ${kernelSpecToLaunch}`;
        } else {
          kernelSpecToLaunch = currentKernelspecs.defaultKernelName;
          msg += ` Using default kernel: ${kernelSpecToLaunch}`;
        }
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, msg);
        logToTelemetry(state$.value, "Launching alternate kernel", msg);
      }

      const sessionPayload = {
        kernel: {
          id: null,
          name: kernelSpecToLaunch
        } as any,
        name: "",
        path: content.filepath.replace(/^\/+/g, ""),
        type: "notebook"
      };

      return sessions.create(serverConfig, sessionPayload).pipe(
        mergeMap(data => {
          const session = data.response;

          const sessionId = castToSessionId(session.id);

          const kernel: RemoteKernelProps = Object.assign({}, session.kernel, {
            type: "websocket",
            info: null,
            sessionId,
            cwd,
            channels: connect(serverConfig, session.kernel.id, sessionId),
            kernelSpecName: kernelSpecToLaunch
          });

          kernel.channels.next(message({ msg_type: "kernel_info_request" }));

          return of(
            actions.launchKernelSuccessful({
              kernel,
              kernelRef,
              contentRef: action.payload.contentRef,
              selectNextKernel: true
            })
          );
        }),
        catchError(error => {
          return of(actions.launchKernelFailed({ error }));
        })
      );
    })
  );
};
/**
 * Override the restartWebSocketKernelEpic from nteract since the /restart endpoint of our kernels has not
 * been implmemented;
 * TODO: Remove this epic once the /restart endpoint is implemented.
 */
export const restartWebSocketKernelEpic = (
  action$: ActionsObservable<actions.RestartKernel | actions.NewKernelAction>,
  state$: StateObservable<AppState>
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
            contentRef
          })
        );
      }

      const host = selectors.currentHost(state);
      if (host.type !== "jupyter") {
        return of(
          actions.restartKernelFailed({
            error: new Error("Can't restart a kernel with no Jupyter host."),
            kernelRef,
            contentRef
          })
        );
      }

      const kernel = selectors.kernel(state, { kernelRef });
      if (!kernel) {
        return of(
          actions.restartKernelFailed({
            error: new Error("Can't restart a kernel that does not exist."),
            kernelRef,
            contentRef
          })
        );
      }

      if (kernel.type !== "websocket" || !kernel.id) {
        return of(
          actions.restartKernelFailed({
            error: new Error("Can only restart Websocket kernels via API."),
            kernelRef,
            contentRef
          })
        );
      }

      const newKernelRef = createKernelRef();
      const kill = actions.killKernel({
        restarting: true,
        kernelRef
      });

      const relaunch = actions.launchKernelByName({
        kernelSpecName: kernel.kernelSpecName ?? undefined,
        cwd: kernel.cwd,
        kernelRef: newKernelRef,
        selectNextKernel: true,
        contentRef: contentRef
      });

      const awaitKernelReady = action$.pipe(
        ofType(actions.LAUNCH_KERNEL_SUCCESSFUL),
        filter((action: actions.NewKernelAction | actions.RestartKernel) => action.payload.kernelRef === newKernelRef),
        take(1),
        timeout(60000), // If kernel doesn't come up within this interval we will abort follow-on actions.
        concatMap(() => {
          const restartSuccess = actions.restartKernelSuccessful({
            kernelRef: newKernelRef,
            contentRef
          });

          if ((action as actions.RestartKernel).payload.outputHandling === "Run All") {
            return of(restartSuccess, actions.executeAllCells({ contentRef }));
          } else {
            return of(restartSuccess);
          }
        }),
        catchError(error => {
          return of(
            actions.restartKernelFailed({
              error,
              kernelRef: newKernelRef,
              contentRef
            })
          );
        })
      );

      return merge(of(kill, relaunch), awaitKernelReady);
    })
  );

/**
 * Override changeWebSocketKernelEpic:
 * - to pass the userId when connecting to the kernel.
 * - to override extractNewKernel()
 * @param action$
 * @param state$
 */
const changeWebSocketKernelEpic = (
  action$: ActionsObservable<actions.ChangeKernelByName>,
  state$: StateObservable<AppState>
) => {
  return action$.pipe(
    ofType(actions.CHANGE_KERNEL_BY_NAME),
    // Only accept jupyter servers for the host with this epic
    filter(() => selectors.isCurrentHostJupyter(state$.value)),
    switchMap((action: actions.ChangeKernelByName) => {
      const {
        payload: { contentRef, oldKernelRef, kernelSpecName }
      } = action;
      const state = state$.value;
      const host = selectors.currentHost(state);
      if (host.type !== "jupyter") {
        return empty();
      }

      const serverConfig: NotebookServiceConfig = selectors.serverConfig(host);
      if (!oldKernelRef) {
        return empty();
      }

      const oldKernel = selectors.kernel(state, { kernelRef: oldKernelRef });
      if (!oldKernel || oldKernel.type !== "websocket") {
        return empty();
      }
      const { sessionId } = oldKernel;
      if (!sessionId) {
        return empty();
      }

      const content = selectors.content(state, { contentRef });
      if (!content || content.type !== "notebook") {
        return empty();
      }
      const {
        filepath,
        model: { notebook }
      } = content;
      const { cwd } = NotebookUtil.extractNewKernel(filepath, notebook);

      const kernelRef = createKernelRef();
      return kernels.start(serverConfig, kernelSpecName, cwd).pipe(
        mergeMap(({ response }) => {
          const { id: kernelId } = response;
          const sessionPayload = {
            kernel: { id: kernelId, name: kernelSpecName }
          };
          // The sessions API will close down the old kernel for us if it is on this session
          return sessions.update(serverConfig, sessionId, sessionPayload).pipe(
            mergeMap(({ response: session }) => {
              const kernel: RemoteKernelProps = Object.assign({}, session.kernel, {
                type: "websocket",
                sessionId,
                cwd,
                channels: connect(serverConfig, session.kernel.id, sessionId),
                kernelSpecName
              });
              return of(
                actions.launchKernelSuccessful({
                  kernel,
                  kernelRef,
                  contentRef: action.payload.contentRef,
                  selectNextKernel: true
                })
              );
            }),
            catchError(error => of(actions.launchKernelFailed({ error, kernelRef, contentRef })))
          );
        }),
        catchError(error => of(actions.launchKernelFailed({ error, kernelRef, contentRef })))
      );
    })
  );
};

/**
 * Automatically focus on cell if only one cell
 * @param action$
 * @param state$
 */
const focusInitialCodeCellEpic = (
  action$: ActionsObservable<actions.CreateCellAppend>,
  state$: StateObservable<AppState>
): Observable<{} | actions.FocusCell> => {
  return action$.pipe(
    ofType(actions.CREATE_CELL_APPEND),
    mergeMap(action => {
      const state = state$.value;
      const contentRef = action.payload.contentRef;
      const model = selectors.model(state, { contentRef });

      // If it's not a notebook, we shouldn't be here
      if (!model || model.type !== "notebook") {
        return empty();
      }

      const cellOrder = selectors.notebook.cellOrder(model);
      if (cellOrder.size === 1) {
        const id = cellOrder.get(0);
        // Focus on the cell
        return of(
          actions.focusCell({
            id,
            contentRef
          })
        );
      }

      return empty();
    })
  );
};

/**
 * Capture some actions to display to notification console
 * TODO: Log these (or everything) in telemetry?
 * @param action$
 * @param state$
 */
const notificationsToUserEpic = (
  action$: ActionsObservable<any>,
  state$: StateObservable<CdbAppState>
): Observable<{}> => {
  return action$.pipe(
    ofType(
      actions.RESTART_KERNEL_SUCCESSFUL,
      actions.RESTART_KERNEL_FAILED,
      actions.SAVE_FULFILLED,
      actions.SAVE_FAILED,
      actions.FETCH_CONTENT_FAILED
    ),
    mergeMap(action => {
      switch (action.type) {
        case actions.RESTART_KERNEL_SUCCESSFUL: {
          const title = "Kernel restart";
          const msg = "Kernel successfully restarted";
          NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, msg);
          logToTelemetry(state$.value, title, msg);
          break;
        }
        case actions.RESTART_KERNEL_FAILED:
          // TODO: enable once incorrect kernel restart failure signals are fixed
          // NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, "Failed to restart kernel");
          break;
        case actions.SAVE_FAILED: {
          const title = "Save failure";
          const msg = `Failed to save notebook: ${(action as actions.SaveFailed).payload.error}`;
          NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, msg);
          logToTelemetry(state$.value, title, msg);
          break;
        }
        case actions.FETCH_CONTENT_FAILED: {
          const typedAction: actions.FetchContentFailed = action;
          const filepath = selectors.filepath(state$.value, { contentRef: typedAction.payload.contentRef });
          const title = "Fetching content failure";
          const msg = `Failed to fetch notebook content: ${filepath}, error: ${typedAction.payload.error}`;
          NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, msg);
          logToTelemetry(state$.value, title, msg);
          break;
        }
      }
      return empty();
    })
  );
};

/**
 * Connection lost: ping server until back up and restart kernel
 * @param action$
 * @param state$
 */
const handleKernelConnectionLostEpic = (
  action$: ActionsObservable<actions.UpdateDisplayFailed>,
  state$: StateObservable<CdbAppState>
): Observable<CdbActions.UpdateKernelRestartDelayAction | actions.RestartKernel | {}> => {
  return action$.pipe(
    ofType(actions.UPDATE_DISPLAY_FAILED),
    mergeMap(action => {
      const state = state$.value;

      const msg = "Notebook was disconnected from kernel";
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, msg);
      logToTelemetry(state, "Error", "Kernel connection error");

      const host = selectors.currentHost(state);
      const serverConfig: NotebookServiceConfig = selectors.serverConfig(host as RecordOf<JupyterHostRecordProps>);

      const contentRef = action.payload.contentRef;
      const kernelRef = selectors.kernelRefByContentRef(state$.value, { contentRef });

      const delayMs = state.cdb.kernelRestartDelayMs;
      if (delayMs > Constants.Notebook.kernelRestartMaxDelayMs) {
        const msg =
          "Restarted kernel too many times. Please reload the page to enable Data Explorer to restart the kernel automatically.";
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, msg);
        logToTelemetry(state, "Kernel restart error", msg);

        const explorer = window.dataExplorer;
        if (explorer) {
          explorer.showOkModalDialog("kernel restarts", msg);
        }
        return of(empty());
      }

      return concat(
        of(CdbActions.UpdateKernelRestartDelay({ delayMs: delayMs * 1.5 })),
        sessions.list(serverConfig).pipe(
          delayWhen(() => timer(delayMs)),
          map(xhr => {
            return actions.restartKernel({
              outputHandling: "None",
              kernelRef,
              contentRef
            });
          }),
          retryWhen(errors => {
            return errors.pipe(
              delayWhen(() => timer(Constants.Notebook.heartbeatDelayMs)),
              tap(() => console.log("retrying...")) // TODO: Send new action?
            );
          })
        )
      );
    })
  );
};

/**
 * Connection lost: clean up kernel ref
 * @param action$
 * @param state$
 */
export const cleanKernelOnConnectionLostEpic = (
  action$: ActionsObservable<actions.UpdateDisplayFailed>,
  state$: StateObservable<AppState>
): Observable<actions.KillKernelSuccessful> => {
  return action$.pipe(
    ofType(actions.UPDATE_DISPLAY_FAILED),
    switchMap(action => {
      const contentRef = action.payload.contentRef;
      const kernelRef = selectors.kernelRefByContentRef(state$.value, { contentRef });
      return of(
        actions.killKernelSuccessful({
          kernelRef
        })
      );
    })
  );
};

/**
 * Execute focused cell and focus next cell
 * @param action$
 * @param state$
 */
const executeFocusedCellAndFocusNextEpic = (
  action$: ActionsObservable<CdbActions.ExecuteFocusedCellAndFocusNextAction>,
  state$: StateObservable<AppState>
): Observable<{} | actions.FocusNextCellEditor> => {
  return action$.pipe(
    ofType(CdbActions.EXECUTE_FOCUSED_CELL_AND_FOCUS_NEXT),
    mergeMap(action => {
      const contentRef = action.payload.contentRef;
      return concat(
        of(actions.executeFocusedCell({ contentRef })),
        of(actions.focusNextCell({ contentRef, createCellIfUndefined: false }))
      );
    })
  );
};

function getUserPuid(): string {
  const arcadiaToken = window.dataExplorer && window.dataExplorer.arcadiaToken();
  if (!arcadiaToken) {
    return undefined;
  }

  let userPuid;
  try {
    const tokenPayload = decryptJWTToken(arcadiaToken);
    if (tokenPayload && tokenPayload.hasOwnProperty("puid")) {
      userPuid = tokenPayload.puid;
    }
  } catch (error) {
    // ignore
  }

  return userPuid;
}

/**
 * Close tab if mimetype not supported
 * @param action$
 * @param state$
 */
const closeUnsupportedMimetypesEpic = (
  action$: ActionsObservable<actions.FetchContentFulfilled>,
  state$: StateObservable<AppState>
): Observable<{}> => {
  return action$.pipe(
    ofType(actions.FETCH_CONTENT_FULFILLED),
    mergeMap(action => {
      const mimetype = action.payload.model.mimetype;
      const explorer = window.dataExplorer;
      if (explorer && !TextFile.handles(mimetype)) {
        const filepath = action.payload.filepath;
        // Close tab and show error message
        explorer.tabsManager.closeTabsByComparator(
          tab => (tab as any).notebookPath && FileSystemUtil.isPathEqual((tab as any).notebookPath(), filepath)
        );
        const msg = `${filepath} cannot be rendered. Please download the file, in order to view it outside of Data Explorer.`;
        explorer.showOkModalDialog("File cannot be rendered", msg);
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, msg);
      }
      return empty();
    })
  );
};

/**
 * Close tab if file content fails to fetch not supported
 * @param action$
 * @param state$
 */
const closeContentFailedToFetchEpic = (
  action$: ActionsObservable<actions.FetchContentFailed>,
  state$: StateObservable<AppState>
): Observable<{}> => {
  return action$.pipe(
    ofType(actions.FETCH_CONTENT_FAILED),
    mergeMap(action => {
      const explorer = window.dataExplorer;
      if (explorer) {
        const filepath = action.payload.filepath;
        // Close tab and show error message
        explorer.tabsManager.closeTabsByComparator(
          tab => (tab as any).notebookPath && FileSystemUtil.isPathEqual((tab as any).notebookPath(), filepath)
        );
        const msg = `Failed to load file: ${filepath}.`;
        explorer.showOkModalDialog("Failure to load", msg);
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, msg);
      }
      return empty();
    })
  );
};

export const allEpics = [
  addInitialCodeCellEpic,
  autoStartKernelEpic,
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
  restartWebSocketKernelEpic
];
