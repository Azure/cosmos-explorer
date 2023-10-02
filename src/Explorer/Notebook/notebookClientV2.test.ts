jest.mock("./NotebookComponent/store");
jest.mock("@nteract/core");
import { defineConfigOption } from "@nteract/mythic-configuration";
import { NotebookClientV2 } from "./NotebookClientV2";
import configureStore from "./NotebookComponent/store";

describe("auto start kernel", () => {
  it("configure autoStartKernelOnNotebookOpen properly depending whether notebook is/is not read-only", async () => {
    (configureStore as jest.Mock).mockReturnValue({
      dispatch: () => {
        /* noop */
      },
    });

    defineConfigOption({
      label: "editorType",
      key: "editorType",
      defaultValue: "foo",
    });

    defineConfigOption({
      label: "autoSaveInterval",
      key: "autoSaveInterval",
      defaultValue: 1234,
    });

    defineConfigOption({
      label: "Line numbers",
      key: "codeMirror.lineNumbers",
      defaultValue: true,
    });

    [true, false].forEach((isReadOnly) => {
      new NotebookClientV2({
        connectionInfo: {
          authToken: "autToken",
          notebookServerEndpoint: "notebookServerEndpoint",
          forwardingId: "Id",
        },
        databaseAccountName: undefined,
        defaultExperience: undefined,
        isReadOnly,
        contentProvider: undefined,
      });

      expect(configureStore).toHaveBeenCalledWith(
        expect.anything(), // initial state
        undefined, // content provider
        expect.anything(), // onTraceFailure
        expect.anything(), // customMiddlewares
        !isReadOnly,
      );
    });
  });
});
