import { AppState, epics as coreEpics, IContentProvider, reducers } from "@nteract/core";
import { configuration } from "@nteract/mythic-configuration";
import { makeConfigureStore } from "@nteract/myths";
import { AnyAction, compose, Dispatch, Middleware, MiddlewareAPI, Store } from "redux";
import { Epic } from "redux-observable";
import { Observable } from "rxjs";
import { catchError } from "rxjs/operators";
import { allEpics } from "./epics";
import { cdbReducer, coreReducer } from "./reducers";
import { CdbAppState } from "./types";

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default function configureStore(
  initialState: Partial<CdbAppState>,
  contentProvider: IContentProvider,
  onTraceFailure: (title: string, message: string) => void,
  customMiddlewares?: Middleware<{}, any, Dispatch<AnyAction>>[],
  autoStartKernelOnNotebookOpen?: boolean,
): Store<CdbAppState, AnyAction> {
  /**
   * Catches errors in reducers
   */
  const catchErrorMiddleware: Middleware =
    <D extends Dispatch<AnyAction>, S extends AppState>({ dispatch, getState }: MiddlewareAPI<D, S>) =>
    (next: Dispatch<AnyAction>) =>
    <A extends AnyAction>(action: A): any => {
      try {
        next(action);
      } catch (error) {
        traceFailure("Reducer failure", error);
      }
    };

  const protect = (epic: Epic) => {
    return (action$: Observable<any>, state$: any, dependencies: any) =>
      epic(action$, state$, dependencies).pipe(
        catchError((error, caught) => {
          traceFailure("Epic failure", error);
          return caught;
        }),
      );
  };

  const traceFailure = (title: string, error: any) => {
    if (error instanceof Error) {
      onTraceFailure(title, `${error.message} ${JSON.stringify(error.stack)}`);
      console.error(error);
    } else {
      onTraceFailure(title, error.message);
    }
  };

  const protectEpics = (epics: Epic[]): Epic[] => {
    return epics.map((epic) => protect(epic));
  };

  const filteredCoreEpics = getCoreEpics(autoStartKernelOnNotebookOpen);

  const mythConfigureStore = makeConfigureStore<CdbAppState>()({
    packages: [configuration],
    reducers: {
      app: reducers.app,
      core: coreReducer as any,
      cdb: cdbReducer,
    },
    epics: protectEpics([...filteredCoreEpics, ...allEpics]),
    epicDependencies: { contentProvider },
    epicMiddleware: customMiddlewares.concat(catchErrorMiddleware),
    enhancer: composeEnhancers,
  });

  const store = mythConfigureStore(initialState as any);

  // TODO Fix typing issue here: createStore() output type doesn't quite match AppState
  // return store as Store<AppState, AnyAction>;
  return store as any;
}

export const getCoreEpics = (autoStartKernelOnNotebookOpen: boolean): Epic[] => {
  // This list needs to be consistent and in sync with core.allEpics until we figure
  // out how to safely filter out the ones we are overriding here.
  const filteredCoreEpics = [
    coreEpics.executeCellEpic,
    coreEpics.executeFocusedCellEpic,
    coreEpics.executeCellAfterKernelLaunchEpic,
    coreEpics.sendExecuteRequestEpic,
    coreEpics.updateDisplayEpic,
    coreEpics.executeAllCellsEpic,
    coreEpics.commListenEpic,
    coreEpics.interruptKernelEpic,
    coreEpics.lazyLaunchKernelEpic,
    coreEpics.killKernelEpic,
    coreEpics.watchExecutionStateEpic,
    coreEpics.restartKernelEpic,
    coreEpics.fetchKernelspecsEpic,
    coreEpics.fetchContentEpic,
    coreEpics.updateContentEpic,
    coreEpics.saveContentEpic,
    coreEpics.publishToBookstore,
    coreEpics.publishToBookstoreAfterSave,
    coreEpics.sendInputReplyEpic,
  ];

  if (autoStartKernelOnNotebookOpen) {
    filteredCoreEpics.push(coreEpics.launchKernelWhenNotebookSetEpic);
  }

  return filteredCoreEpics;
};
