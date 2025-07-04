import type { IIndexMetric } from "Explorer/Tabs/QueryTab/ResultsView";
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
    const lines = (indexMetrics as string).split("\n").map((line) => line.trim()).filter(Boolean);
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
            const indexObj: any = { index, impact };
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
                const pathRegex = /\/[^\/\s*?]+(?:\/[^\/\s*?]+)*(\/\*|\?)/;
                const match = index.match(pathRegex);
                if (match) {
                    path = match[0];
                } else {
                    const simplePathRegex = /\/[^\/\s]+/;
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