import { CircleFilled } from "@fluentui/react-icons";
import type { IIndexMetric } from "Explorer/Tabs/QueryTab/ResultsView";
import { useIndexAdvisorStyles } from "Explorer/Tabs/QueryTab/StylesAdvisor";
import * as React from "react";
interface IndexObject {
  index: string;
  impact: string;
  section: "Included" | "Not Included" | "Header";
  composite?: {
    path: string;
    order: "ascending" | "descending";
  }[];
  path?: string;
}

export interface IndexMetricsJson {
  included?: IIndexMetric[];
  notIncluded?: IIndexMetric[];
}
export function parseIndexMetrics(indexMetrics: string | IndexMetricsJson): {
  included: IIndexMetric[];
  notIncluded: IIndexMetric[];
} {
  // If already JSON, just extract arrays
  if (typeof indexMetrics === "object" && indexMetrics !== null) {
    return {
      included: Array.isArray(indexMetrics.included) ? indexMetrics.included : [],
      notIncluded: Array.isArray(indexMetrics.notIncluded) ? indexMetrics.notIncluded : [],
    };
  }

  // Otherwise, parse as string (current SDK)
  const included: IIndexMetric[] = [];
  const notIncluded: IIndexMetric[] = [];
  const lines = (indexMetrics as string)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  let currentSection = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("Utilized Single Indexes") || line.startsWith("Utilized Composite Indexes")) {
      currentSection = "included";
    } else if (line.startsWith("Potential Single Indexes") || line.startsWith("Potential Composite Indexes")) {
      currentSection = "notIncluded";
    } else if (line.startsWith("Index Spec:")) {
      const index = line.replace("Index Spec:", "").trim();
      const impactLine = lines[i + 1];
      const impact = impactLine?.includes("Index Impact Score:") ? impactLine.split(":")[1].trim() : "Unknown";

      const isComposite = index.includes(",");

      const sectionMap: Record<string, "Included" | "Not Included"> = {
        included: "Included",
        notIncluded: "Not Included",
      };

      const indexObj: IndexObject = { index, impact, section: sectionMap[currentSection] ?? "Header" };
      if (isComposite) {
        indexObj.composite = index.split(",").map((part: string) => {
          const [path, order] = part.trim().split(/\s+/);
          return {
            path: path.trim(),
            order: order?.toLowerCase() === "desc" ? "descending" : "ascending",
          };
        });
      } else {
        let path = "/unknown/*";
        const pathRegex = /\/[^/\s*?]+(?:\/[^/\s*?]+)*(\/\*|\?)/;
        const match = index.match(pathRegex);
        if (match) {
          path = match[0];
        } else {
          const simplePathRegex = /\/[^/\s]+/;
          const simpleMatch = index.match(simplePathRegex);
          if (simpleMatch) {
            path = simpleMatch[0] + "/*";
          }
        }
        indexObj.path = path;
      }

      if (currentSection === "included") {
        included.push(indexObj);
      } else if (currentSection === "notIncluded") {
        notIncluded.push(indexObj);
      }
    }
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
