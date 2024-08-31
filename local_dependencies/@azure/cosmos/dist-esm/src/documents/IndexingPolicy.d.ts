import { DataType, IndexingMode, IndexKind } from "./index";
export interface IndexingPolicy {
    /** The indexing mode (consistent or lazy) {@link IndexingMode}. */
    indexingMode?: keyof typeof IndexingMode;
    automatic?: boolean;
    /** An array of {@link IncludedPath} represents the paths to be included for indexing. */
    includedPaths?: IndexedPath[];
    /** An array of {@link IncludedPath} represents the paths to be excluded for indexing. */
    excludedPaths?: IndexedPath[];
    spatialIndexes?: SpatialIndex[];
    /** An array of {@link VectorIndex} represents the vector index paths to be included for indexing. */
    vectorIndexes?: VectorIndex[];
}
export declare enum SpatialType {
    LineString = "LineString",
    MultiPolygon = "MultiPolygon",
    Point = "Point",
    Polygon = "Polygon"
}
export interface SpatialIndex {
    path: string;
    types: SpatialType[];
    boundingBox: {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
    };
}
export interface IndexedPath {
    path: string;
    indexes?: Index[];
}
export interface Index {
    kind: keyof typeof IndexKind;
    dataType: keyof typeof DataType;
    precision?: number;
}
/**
 * Represents a vector index in the Azure Cosmos DB service.
 * A vector index is used to index vector fields in the documents.
 */
export interface VectorIndex {
    /**
     * The path to the vector field in the document.
     * for example, path: "/path/to/vector".
     */
    path: string;
    /**
     * The index type of the vector.
     * Currently, flat, diskANN, and quantizedFlat are supported.
     */
    type: "flat" | "diskANN" | "quantizedFlat";
}
//# sourceMappingURL=IndexingPolicy.d.ts.map