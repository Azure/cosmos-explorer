import { IndexUtilizationInfo } from "./IndexUtilizationInfo";
export declare class IndexMetricWriter {
    writeIndexMetrics(indexUtilizationInfo: IndexUtilizationInfo): string;
    protected writeBeforeIndexUtilizationInfo(result: string): string;
    protected writeIndexUtilizationInfo(result: string, indexUtilizationInfo: IndexUtilizationInfo): string;
    protected writeAfterIndexUtilizationInfo(result: string): string;
    private writeSingleIndexUtilizationEntity;
    private writeCompositeIndexUtilizationEntity;
    private appendNewlineToResult;
    private appendHeaderToResult;
}
//# sourceMappingURL=IndexMetricWriter.d.ts.map