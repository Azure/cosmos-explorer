import { createImmutableOutput, JSONObject, OnDiskOutput } from "@nteract/commutable";
// import outputs individually to avoid increasing the bundle size
import { KernelOutputError } from "@nteract/outputs/lib/components/kernel-output-error";
import { Output } from "@nteract/outputs/lib/components/output";
import { StreamText } from "@nteract/outputs/lib/components/stream-text";
import { ContentRef } from "@nteract/types";
import "bootstrap/dist/css/bootstrap.css";
import postRobot from "post-robot";
import * as React from "react";
import * as ReactDOM from "react-dom";
import "../../externals/iframeResizer.contentWindow.min.js"; // Required for iFrameResizer to work
import { SnapshotRequest } from "../Explorer/Notebook/NotebookComponent/types";
import "../Explorer/Notebook/NotebookRenderer/base.css";
import "../Explorer/Notebook/NotebookRenderer/default.css";
import { NotebookUtil } from "../Explorer/Notebook/NotebookUtil";
import "./CellOutputViewer.less";
import { TransformMedia } from "./TransformMedia";

export interface SnapshotResponse {
  imageSrc: string;
  requestId: string;
}
export interface CellOutputViewerProps {
  id: string;
  contentRef: ContentRef;
  outputsContainerClassName: string;
  outputClassName: string;
  outputs: OnDiskOutput[];
  onMetadataChange: (metadata: JSONObject, mediaType: string, index?: number) => void;
}

const onInit = async () => {
  postRobot.on(
    "props",
    {
      window: window.parent,
      domain: window.location.origin,
    },
    (event) => {
      // Typescript definition for event is wrong. So read props by casting to <any>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props = (event as any).data as CellOutputViewerProps;
      const outputs = (
        <div data-iframe-height className={props.outputsContainerClassName}>
          {props.outputs?.map((output, index) => (
            <div className={props.outputClassName} key={index}>
              <Output output={createImmutableOutput(output)} key={index}>
                <TransformMedia
                  output_type={"display_data"}
                  id={props.id}
                  contentRef={props.contentRef}
                  onMetadataChange={(metadata, mediaType) => props.onMetadataChange(metadata, mediaType, index)}
                />
                <TransformMedia
                  output_type={"execute_result"}
                  id={props.id}
                  contentRef={props.contentRef}
                  onMetadataChange={(metadata, mediaType) => props.onMetadataChange(metadata, mediaType, index)}
                />
                <KernelOutputError />
                <StreamText />
              </Output>
            </div>
          ))}
        </div>
      );

      ReactDOM.render(outputs, document.getElementById("cellOutput"));
    }
  );

  postRobot.on(
    "snapshotRequest",
    {
      window: window.parent,
      domain: window.location.origin,
    },
    async (event): Promise<SnapshotResponse> => {
      const topNode = document.getElementById("cellOutput");
      if (!topNode) {
        const errorMsg = "No top node to snapshot";
        return Promise.reject(new Error(errorMsg));
      }

      // Typescript definition for event is wrong. So read props by casting to <any>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const snapshotRequest = (event as any).data as SnapshotRequest;
      const result = await NotebookUtil.takeScreenshotDomToImage(
        topNode,
        snapshotRequest.aspectRatio,
        undefined,
        snapshotRequest.downloadFilename
      );

      return {
        imageSrc: result.imageSrc,
        requestId: snapshotRequest.requestId,
      };
    }
  );
};

// Entry point
window.addEventListener("load", onInit);
