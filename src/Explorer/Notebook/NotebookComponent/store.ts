import { AppState, epics as coreEpics, reducers, IContentProvider } from "@nteract/core";
import { compose, Store, AnyAction, Middleware, Dispatch, MiddlewareAPI } from "redux";
import { createEpicMiddleware, Epic } from "redux-observable";
import { allEpics } from "./epics";
import { coreReducer, cdbReducer } from "./reducers";
import { catchError } from "rxjs/operators";
import { Observable } from "rxjs";
import { configuration } from "@nteract/mythic-configuration";
import { makeConfigureStore } from "@nteract/myths";
import { CdbAppState } from "./types";

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default function configureStore(
  initialState: Partial<CdbAppState>,
  contentProvider: IContentProvider,
  onTraceFailure: (title: string, message: string) => void,
  customMiddlewares?: Middleware<{}, any, Dispatch<AnyAction>>[]
): Store<CdbAppState, AnyAction> {
  /**
   * Catches errors in reducers
   */
  const catchErrorMiddleware: Middleware = <D extends Dispatch<AnyAction>, S extends AppState>({
    dispatch,
    getState
  }: MiddlewareAPI<D, S>) => (next: Dispatch<AnyAction>) => <A extends AnyAction>(action: A): any => {
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
        })
      );
  };

  const traceFailure = (title: string, error: any) => {
    if (error instanceof Error) {
      onTraceFailure(title, `${error.message} ${JSON.stringify(error.stack)}`);
      console.error(error);
    } else {
      onTraceFailure(title, JSON.stringify(error));
    }
  };

  const protectEpics = (epics: Epic[]): Epic[] => {
    return epics.map(epic => protect(epic));
  };

  // This list needs to be consistent and in sync with core.allEpics until we figure
  // out how to safely filter out the ones we are overriding here.
  const filteredCoreEpics = [
    coreEpics.autoSaveCurrentContentEpic,
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
    coreEpics.sendInputReplyEpic
  ];

  const mythConfigureStore = makeConfigureStore<CdbAppState>()({
    packages: [configuration],
    reducers: {
      app: reducers.app,
      core: coreReducer as any,
      cdb: cdbReducer
    },
    epics: protectEpics([...filteredCoreEpics, ...allEpics]),
    epicDependencies: { contentProvider },
    epicMiddleware: [catchErrorMiddleware],
    enhancer: composeEnhancers
  });

  const store = mythConfigureStore(initialState as any);

  // TODO Fix typing issue here: createStore() output type doesn't quite match AppState
  // return store as Store<AppState, AnyAction>;
  return store as any;
}
