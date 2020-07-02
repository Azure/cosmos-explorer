import { AppState, epics as coreEpics, reducers, IContentProvider } from "@nteract/core";
import {
  applyMiddleware,
  combineReducers,
  compose,
  createStore,
  Store,
  AnyAction,
  Middleware,
  Dispatch,
  MiddlewareAPI,
} from "redux";
import { combineEpics, createEpicMiddleware, Epic, ActionsObservable } from "redux-observable";
import { allEpics } from "./epics";
import { coreReducer, cdbReducer } from "./reducers";
import { catchError } from "rxjs/operators";

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default function configureStore(
  initialState: Partial<AppState>,
  contentProvider: IContentProvider,
  onTraceFailure: (title: string, message: string) => void,
  customMiddlewares?: Middleware<{}, any, Dispatch<AnyAction>>[]
): Store<AppState, AnyAction> {
  const rootReducer = combineReducers({
    app: reducers.app,
    comms: reducers.comms,
    config: reducers.config,
    core: coreReducer,
    cdb: cdbReducer,
  });

  /**
   * Catches errors in reducers
   */
  const catchErrorMiddleware: Middleware = <D extends Dispatch<AnyAction>, S extends AppState>({
    dispatch,
    getState,
  }: MiddlewareAPI<D, S>) => (next: Dispatch<AnyAction>) => <A extends AnyAction>(action: A): any => {
    try {
      next(action);
    } catch (error) {
      traceFailure("Reducer failure", error);
    }
  };

  const protect = (epic: Epic) => {
    return (action$: ActionsObservable<any>, state$: any, dependencies: any) =>
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

  const combineAndProtectEpics = (epics: Epic[]): Epic => {
    const protectedEpics = epics.map((epic) => protect(epic));
    return combineEpics<Epic>(...protectedEpics);
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
    coreEpics.sendInputReplyEpic,
  ];
  const rootEpic = combineAndProtectEpics([...filteredCoreEpics, ...allEpics]);
  const epicMiddleware = createEpicMiddleware({ dependencies: { contentProvider } });
  let middlewares: Middleware[] = [epicMiddleware];
  // TODO: tamitta: errorMiddleware was removed, do we need a substitute?

  if (customMiddlewares) {
    middlewares = middlewares.concat(customMiddlewares);
  }
  middlewares.push(catchErrorMiddleware);

  const store = createStore(rootReducer, initialState, composeEnhancers(applyMiddleware(...middlewares)));

  epicMiddleware.run(rootEpic);

  // TODO Fix typing issue here: createStore() output type doesn't quite match AppState
  return store as Store<AppState, AnyAction>;
}
