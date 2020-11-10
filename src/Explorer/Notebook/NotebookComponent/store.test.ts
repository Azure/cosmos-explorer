import { getCoreEpics } from "./store";
import { epics } from "@nteract/core";

describe("configure redux store", () => {
  it("configures store with correct epic if based on autoStartKernelOnNotebookOpen", () => {
    // For now, assume launchKernelWhenNotebookSetEpic is the last epic
    let filteredEpics = getCoreEpics(true);
    expect(filteredEpics.pop()).toEqual(epics.launchKernelWhenNotebookSetEpic);

    filteredEpics = getCoreEpics(false);
    expect(filteredEpics.pop()).not.toEqual(epics.launchKernelWhenNotebookSetEpic);
  });
});
