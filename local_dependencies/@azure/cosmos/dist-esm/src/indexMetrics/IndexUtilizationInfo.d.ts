import { SingleIndexUtilizationEntity } from "./SingleIndexUtilizationEntity";
import { CompositeIndexUtilizationEntity } from "./CompositeIndexUtilizationEntity";
export declare class IndexUtilizationInfo {
    readonly UtilizedSingleIndexes: SingleIndexUtilizationEntity[];
    readonly PotentialSingleIndexes: SingleIndexUtilizationEntity[];
    readonly UtilizedCompositeIndexes: CompositeIndexUtilizationEntity[];
    readonly PotentialCompositeIndexes: CompositeIndexUtilizationEntity[];
    static readonly Empty: IndexUtilizationInfo;
    constructor(UtilizedSingleIndexes: SingleIndexUtilizationEntity[], PotentialSingleIndexes: SingleIndexUtilizationEntity[], UtilizedCompositeIndexes: CompositeIndexUtilizationEntity[], PotentialCompositeIndexes: CompositeIndexUtilizationEntity[]);
    static tryCreateFromDelimitedBase64String(delimitedString: string, out: {
        result?: IndexUtilizationInfo;
    }): boolean;
    static tryCreateFromDelimitedString(delimitedString: string, out: {
        result?: IndexUtilizationInfo;
    }): boolean;
    static createFromString(delimitedString: string, isBase64Encoded: boolean): IndexUtilizationInfo;
}
//# sourceMappingURL=IndexUtilizationInfo.d.ts.map