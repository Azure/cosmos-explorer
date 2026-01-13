import { CircleFilled } from "@fluentui/react-icons";
import type { IIndexMetric } from "Explorer/Tabs/QueryTab/ResultsView";
import { useIndexAdvisorStyles } from "Explorer/Tabs/QueryTab/StylesAdvisor";
import * as React from "react";

// SDK response format
export interface IndexMetricsResponse {
  UtilizedIndexes?: {
    SingleIndexes?: Array<{ IndexSpec: string; IndexImpactScore?: string }>;
    CompositeIndexes?: Array<{ IndexSpecs: string[]; IndexImpactScore?: string }>;
  };
  PotentialIndexes?: {
    SingleIndexes?: Array<{ IndexSpec: string; IndexImpactScore?: string }>;
    CompositeIndexes?: Array<{ IndexSpecs: string[]; IndexImpactScore?: string }>;
  };
}

export function parseIndexMetrics(indexMetrics: IndexMetricsResponse): {
  included: IIndexMetric[];
  notIncluded: IIndexMetric[];
} {
  const included: IIndexMetric[] = [];
  const notIncluded: IIndexMetric[] = [];

  // Process UtilizedIndexes (Included in Current Policy)
  if (indexMetrics.UtilizedIndexes) {
    // Single indexes
    indexMetrics.UtilizedIndexes.SingleIndexes?.forEach((index) => {
      included.push({
        index: index.IndexSpec,
        impact: index.IndexImpactScore || "Utilized",
        section: "Included",
        path: index.IndexSpec,
      });
    });

    // Composite indexes
    indexMetrics.UtilizedIndexes.CompositeIndexes?.forEach((index) => {
      const compositeSpec = index.IndexSpecs.join(", ");
      included.push({
        index: compositeSpec,
        impact: index.IndexImpactScore || "Utilized",
        section: "Included",
        composite: index.IndexSpecs.map((spec) => {
          const [path, order] = spec.trim().split(/\s+/);
          return {
            path: path.trim(),
            order: order?.toLowerCase() === "desc" ? "descending" : "ascending",
          };
        }),
      });
    });
  }

  // Process PotentialIndexes (Not Included in Current Policy)
  if (indexMetrics.PotentialIndexes) {
    // Single indexes
    indexMetrics.PotentialIndexes.SingleIndexes?.forEach((index) => {
      notIncluded.push({
        index: index.IndexSpec,
        impact: index.IndexImpactScore || "Unknown",
        section: "Not Included",
        path: index.IndexSpec,
      });
    });

    // Composite indexes
    indexMetrics.PotentialIndexes.CompositeIndexes?.forEach((index) => {
      const compositeSpec = index.IndexSpecs.join(", ");
      notIncluded.push({
        index: compositeSpec,
        impact: index.IndexImpactScore || "Unknown",
        section: "Not Included",
        composite: index.IndexSpecs.map((spec) => {
          const [path, order] = spec.trim().split(/\s+/);
          return {
            path: path.trim(),
            order: order?.toLowerCase() === "desc" ? "descending" : "ascending",
          };
        }),
      });
    });
  }

  return { included, notIncluded };
}

export const renderImpactDots = (impact: string): JSX.Element => {
  const style = useIndexAdvisorStyles();
  let count = 0;

  if (impact === "High") {
    count = 3;
  } else if (impact === "Medium") {
    count = 2;
  } else if (impact === "Low") {
    count = 1;
  }

  return (
    <div className={style.indexAdvisorImpactDots}>
      {Array.from({ length: count }).map((_, i) => (
        <CircleFilled key={i} className={style.indexAdvisorImpactDot} />
      ))}
    </div>
  );
};
