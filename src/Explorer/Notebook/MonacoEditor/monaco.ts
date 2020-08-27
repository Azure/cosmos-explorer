export * from "monaco-editor/esm/vs/editor/editor.api";

// /**
//  * Set the custom worker url to workaround the cross-domain issue with creating web worker
//  * See https://github.com/microsoft/monaco-editor/blob/master/docs/integrate-amd-cross.md for more details
//  * This step has to be executed after a importing of monaco-editor once per chunk to make sure
//  * the custom worker url overwrites the one from monaco-editor module itself.
//  */
// import { setMonacoWorkerUrl } from "./workerUrl";
// setMonacoWorkerUrl();
