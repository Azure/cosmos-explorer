import { Shimmer, ShimmerElementType, Stack } from "@fluentui/react";
import * as React from "react";

export interface IndentLevel {
  level: number;
  width?: string;
}
interface ShimmerTreeProps {
  indentLevels: IndentLevel[];
  style?: React.CSSProperties;
}

const ShimmerTree = ({ indentLevels, style = {} }: ShimmerTreeProps) => {
  const renderShimmers = (indent: IndentLevel) => (
    <Shimmer
      key={Math.random()}
      shimmerElements={[
        { type: ShimmerElementType.gap, width: `${indent.level * 20}px` },
        { type: ShimmerElementType.line, height: 16, width: indent.width || "100%" },
      ]}
      style={{ marginBottom: 8 }}
    />
  );

  return (
    <Stack tokens={{ childrenGap: 8 }} style={{ width: "50%", ...style }} data-test="shimmer-stack">
      {indentLevels.map((indentLevel: IndentLevel) => renderShimmers(indentLevel))}
    </Stack>
  );
};

export default ShimmerTree;
