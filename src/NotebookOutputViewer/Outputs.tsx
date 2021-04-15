import { createImmutableOutput, JSONObject, OnDiskOutput } from "@nteract/commutable";
import { ContentRef } from "@nteract/core";
import { KernelOutputError, Output, StreamText } from "@nteract/outputs";
import React, { FunctionComponent } from "react";
import { TransformMedia } from "./TransformMedia";

export interface OutputsProps {
  id: string;
  contentRef: ContentRef;
  hidden: boolean;
  expanded: boolean;
  outputs: OnDiskOutput[];
  onMetadataChange: (metadata: JSONObject, mediaType: string, index?: number) => void;
}

export const Outputs: FunctionComponent<OutputsProps> = ({
  id,
  contentRef,
  outputs,
  hidden,
  expanded,
  onMetadataChange,
}) => (
  <div className={`nteract-cell-outputs ${hidden ? "hidden" : ""} ${expanded ? "expanded" : ""}`}>
    {outputs?.map((output, index) => (
      <Output output={createImmutableOutput(output)} key={index}>
        <TransformMedia
          output_type={"display_data"}
          id={id}
          contentRef={contentRef}
          onMetadataChange={(metadata, mediaType) => onMetadataChange(metadata, mediaType, index)}
        />
        <TransformMedia
          output_type={"execute_result"}
          id={id}
          contentRef={contentRef}
          onMetadataChange={(metadata, mediaType) => onMetadataChange(metadata, mediaType, index)}
        />
        <KernelOutputError />
        <StreamText />
      </Output>
    ))}
  </div>
);
