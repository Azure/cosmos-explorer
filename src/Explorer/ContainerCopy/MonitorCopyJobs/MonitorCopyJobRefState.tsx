import create from "zustand";
import { MonitorCopyJobsRef } from "./MonitorCopyJobs";

type MonitorCopyJobsRefStateType = {
    ref: MonitorCopyJobsRef;
    setRef: (ref: MonitorCopyJobsRef) => void;
};

export const MonitorCopyJobsRefState = create<MonitorCopyJobsRefStateType>((set) => ({
    ref: null,
    setRef: (ref) => set({ ref: ref }),
}));