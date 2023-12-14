import { makeNotebookRecord } from "@nteract/commutable";
import { actions, state } from "@nteract/core";
import * as Immutable from "immutable";
import { StateObservable } from "redux-observable";
import { Subject, of } from "rxjs";
import { toArray } from "rxjs/operators";
import * as sinon from "sinon";

import { NotebookUtil } from "../NotebookUtil";
import { launchWebSocketKernelEpic } from "./epics";
import { CdbAppState, makeCdbRecord } from "./types";

import { sessions } from "rx-jupyter";

describe("Extract kernel from notebook", () => {
  it("Reads metadata kernelspec first", () => {
    const fakeNotebook = makeNotebookRecord({
      metadata: Immutable.Map({
        kernelspec: {
          display_name: "Python 3",
          language: "python",
          name: "python3",
        },
        language_info: {
          name: "python",
          version: "3.7.3",
          mimetype: "text/x-python",
          codemirror_mode: {
            name: "ipython",
            version: 3,
          },
          pygments_lexer: "ipython3",
          nbconvert_exporter: "python",
          file_extension: ".py",
        },
      }),
    });

    const result = NotebookUtil.extractNewKernel("blah", fakeNotebook);
    expect(result.kernelSpecName).toEqual("python3");
  });

  it("Reads language info in metadata if kernelspec not present", () => {
    const fakeNotebook = makeNotebookRecord({
      metadata: Immutable.Map({
        language_info: {
          name: "python",
          version: "3.7.3",
          mimetype: "text/x-python",
          codemirror_mode: {
            name: "ipython",
            version: 3,
          },
          pygments_lexer: "ipython3",
          nbconvert_exporter: "python",
          file_extension: ".py",
        },
      }),
    });

    const result = NotebookUtil.extractNewKernel("blah", fakeNotebook);
    expect(result.kernelSpecName).toEqual("python");
  });

  it("Returns nothing if no kernelspec nor language info is found in metadata", () => {
    const fakeNotebook = makeNotebookRecord({
      metadata: Immutable.Map({
        blah: "this should be ignored",
      }),
    });

    const result = NotebookUtil.extractNewKernel("blah", fakeNotebook);
    expect(result.kernelSpecName).toEqual(undefined);
  });
});

const initialState = {
  app: state.makeAppRecord({
    host: state.makeJupyterHostRecord({
      type: "jupyter",
      token: "eh",
      basePath: "/",
    }),
  }),
  comms: state.makeCommsRecord(),
  config: Immutable.Map({}),
  core: state.makeStateRecord({
    kernelRef: "fake",
    entities: state.makeEntitiesRecord({
      contents: state.makeContentsRecord({
        byRef: Immutable.Map({
          fakeContentRef: state.makeNotebookContentRecord(),
        }),
      }),
      kernels: state.makeKernelsRecord({
        byRef: Immutable.Map({
          fake: state.makeRemoteKernelRecord({
            type: "websocket",
            channels: new Subject<any>(),
            kernelSpecName: "fancy",
            id: "0",
          }),
        }),
      }),
    }),
  }),
  cdb: makeCdbRecord({
    databaseAccountName: "dbAccountName",
    defaultExperience: "defaultExperience",
  }),
};

describe("launchWebSocketKernelEpic", () => {
  const createSpy = sinon.spy(sessions, "create");

  const contentRef = "fakeContentRef";
  const kernelRef = "fake";

  it("launches remote kernels", async () => {
    const state$ = new StateObservable(new Subject<CdbAppState>() as any, initialState);

    const cwd = "/";
    const kernelId = "123";
    const kernelSpecName = "kernelspecname";
    const sessionId = "sessionId";

    const action$ = of(
      actions.launchKernelByName({
        contentRef,
        kernelRef,
        kernelSpecName,
        cwd,
        selectNextKernel: true,
      }),
    );

    (sessions as any).__setResponse({
      originalEvent: undefined,
      xhr: new XMLHttpRequest(),
      request: null,
      status: 200,
      response: {
        id: sessionId,
        path: "notebooks/Untitled7.ipynb",
        name: "",
        type: "notebook",
        kernel: {
          id: kernelId,
          name: "kernel_launched",
          last_activity: "2019-11-07T14:29:54.432454Z",
          execution_state: "starting",
          connections: 0,
        },
        notebook: {
          path: "notebooks/Untitled7.ipynb",
          name: "",
        },
      },
      responseText: null,
      responseType: "json",
    });

    const responseActions = await launchWebSocketKernelEpic(action$, state$).pipe(toArray()).toPromise();

    expect(responseActions).toMatchObject([
      {
        type: actions.LAUNCH_KERNEL_SUCCESSFUL,
        payload: {
          contentRef,
          kernelRef,
          selectNextKernel: true,
          kernel: {
            info: null,
            sessionId: sessionId,
            type: "websocket",
            kernelSpecName,
            cwd,
            id: kernelId,
          },
        },
      },
    ]);
  });

  it("launches any kernel with no kernelspecs in the state", async () => {
    const state$ = new StateObservable(new Subject<CdbAppState>() as any, initialState);

    const cwd = "/";
    const kernelId = "123";
    const kernelSpecName = "kernelspecname";
    const sessionId = "sessionId";

    const action$ = of(
      actions.launchKernelByName({
        contentRef,
        kernelRef,
        kernelSpecName,
        cwd,
        selectNextKernel: true,
      }),
    );

    (sessions as any).__setResponse({
      originalEvent: undefined,
      xhr: new XMLHttpRequest(),
      request: null,
      status: 200,
      response: {
        id: sessionId,
        path: "notebooks/Untitled7.ipynb",
        name: "",
        type: "notebook",
        kernel: {
          id: kernelId,
          name: "kernel_launched",
          last_activity: "2019-11-07T14:29:54.432454Z",
          execution_state: "starting",
          connections: 0,
        },
        notebook: {
          path: "notebooks/Untitled7.ipynb",
          name: "",
        },
      },
      responseText: null,
      responseType: "json",
    });

    await launchWebSocketKernelEpic(action$, state$).pipe(toArray()).toPromise();

    expect(createSpy.lastCall.args[1]).toMatchObject({
      kernel: {
        name: kernelSpecName,
      },
    });
  });

  it("launches no kernel if no kernel is specified and state has no kernelspecs", async () => {
    const state$ = new StateObservable(new Subject<CdbAppState>() as any, initialState);

    const cwd = "/";
    const kernelId = "123";
    const kernelSpecName = "kernelspecname";
    const sessionId = "sessionId";

    const action$ = of(
      actions.launchKernelByName({
        contentRef,
        kernelRef,
        kernelSpecName: undefined,
        cwd,
        selectNextKernel: true,
      }),
    );

    (sessions as any).__setResponse({
      originalEvent: undefined,
      xhr: new XMLHttpRequest(),
      request: null,
      status: 200,
      response: {
        id: sessionId,
        path: "notebooks/Untitled7.ipynb",
        name: "",
        type: "notebook",
        kernel: {
          id: kernelId,
          name: "kernel_launched",
          last_activity: "2019-11-07T14:29:54.432454Z",
          execution_state: "starting",
          connections: 0,
        },
        notebook: {
          path: "notebooks/Untitled7.ipynb",
          name: "",
        },
      },
      responseText: null,
      responseType: "json",
    });

    const responseActions = await launchWebSocketKernelEpic(action$, state$).pipe(toArray()).toPromise();

    expect(responseActions).toMatchObject([
      {
        type: actions.LAUNCH_KERNEL_FAILED,
      },
    ]);
  });

  it("emits an error if backend returns an error", async () => {
    const state$ = new StateObservable(new Subject<CdbAppState>() as any, initialState);

    const cwd = "/";
    const action$ = of(
      actions.launchKernelByName({
        contentRef,
        kernelRef,
        kernelSpecName: undefined,
        cwd,
        selectNextKernel: true,
      }),
    );

    (sessions as any).__setResponse({
      originalEvent: undefined,
      xhr: new XMLHttpRequest(),
      request: null,
      status: 500,
      response: null,
      responseText: null,
      responseType: "json",
    });

    const responseActions = await launchWebSocketKernelEpic(action$, state$).pipe(toArray()).toPromise();

    expect(responseActions).toMatchObject([
      {
        type: actions.LAUNCH_KERNEL_FAILED,
      },
    ]);
  });

  describe("Choose correct kernelspecs to launch", () => {
    beforeAll(() => {
      // Initialize kernelspecs with 2 supported kernels
      const createKernelSpecsRecord = (): Immutable.RecordOf<state.KernelspecsRecordProps> =>
        state.makeKernelspecsRecord({
          byRef: Immutable.Map({
            kernelspecsref: state.makeKernelspecsByRefRecord({
              defaultKernelName: "kernel2",
              byName: Immutable.Map({
                kernel1: state.makeKernelspec({
                  name: "kernel1",
                  argv: Immutable.List([]),
                  env: Immutable.Map(),
                  interruptMode: "interruptMode1",
                  language: "language1",
                  displayName: "Kernel One",
                  metadata: Immutable.Map(),
                  resources: Immutable.Map(),
                }),
                kernel2: state.makeKernelspec({
                  name: "kernel2",
                  argv: Immutable.List([]),
                  env: Immutable.Map(),
                  interruptMode: "interruptMode2",
                  language: "language2",
                  displayName: "Kernel Two",
                  metadata: Immutable.Map(),
                  resources: Immutable.Map(),
                }),
              }),
            }),
          }),
          refs: Immutable.List(["kernelspecsref"]),
        });
      initialState.core = initialState.core
        .setIn(["entities", "kernelspecs"], createKernelSpecsRecord())
        .set("currentKernelspecsRef", "kernelspecsref");

      // some fake response we don't care about
      (sessions as any).__setResponse({
        originalEvent: undefined,
        xhr: new XMLHttpRequest(),
        request: null,
        status: 200,
        response: {
          id: "sessionId",
          path: "notebooks/Untitled7.ipynb",
          name: "",
          type: "notebook",
          kernel: {
            id: "kernelId",
            name: "kernel_launched",
            last_activity: "2019-11-07T14:29:54.432454Z",
            execution_state: "starting",
            connections: 0,
          },
          notebook: {
            path: "notebooks/Untitled7.ipynb",
            name: "",
          },
        },
        responseText: null,
        responseType: "json",
      });
    });

    it("launches supported kernel in kernelspecs", async () => {
      const state$ = new StateObservable(new Subject<CdbAppState>() as any, initialState);

      const action$ = of(
        actions.launchKernelByName({
          contentRef,
          kernelRef,
          kernelSpecName: "kernel2",
          cwd: "cwd",
          selectNextKernel: true,
        }),
      );

      await launchWebSocketKernelEpic(action$, state$).pipe(toArray()).toPromise();
      expect(createSpy.lastCall.args[1]).toMatchObject({
        kernel: {
          name: "kernel2",
        },
      });
    });

    it("launches undefined kernel uses default kernel from kernelspecs", async () => {
      const state$ = new StateObservable(new Subject<CdbAppState>() as any, initialState);

      const action$ = of(
        actions.launchKernelByName({
          contentRef,
          kernelRef,
          kernelSpecName: undefined,
          cwd: "cwd",
          selectNextKernel: true,
        }),
      );

      await launchWebSocketKernelEpic(action$, state$).pipe(toArray()).toPromise();

      expect(createSpy.lastCall.args[1]).toMatchObject({
        kernel: {
          name: "kernel2",
        },
      });
    });

    it("launches unsupported kernel uses default kernel from kernelspecs", async () => {
      const state$ = new StateObservable(new Subject<CdbAppState>() as any, initialState);

      const action$ = of(
        actions.launchKernelByName({
          contentRef,
          kernelRef,
          kernelSpecName: "This is an unknown kernelspec",
          cwd: "cwd",
          selectNextKernel: true,
        }),
      );

      await launchWebSocketKernelEpic(action$, state$).pipe(toArray()).toPromise();

      expect(createSpy.lastCall.args[1]).toMatchObject({
        kernel: {
          name: "kernel2",
        },
      });
    });

    it("launches unsupported kernel uses kernelspecs with similar name", async () => {
      const state$ = new StateObservable(new Subject<CdbAppState>() as any, initialState);

      const action$ = of(
        actions.launchKernelByName({
          contentRef,
          kernelRef,
          kernelSpecName: "ernel1",
          cwd: "cwd",
          selectNextKernel: true,
        }),
      );

      await launchWebSocketKernelEpic(action$, state$).pipe(toArray()).toPromise();

      expect(createSpy.lastCall.args[1]).toMatchObject({
        kernel: {
          name: "kernel1",
        },
      });
    });
  });
});
