// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import Constants from "./Constants";
export class IndexMetricWriter {
    writeIndexMetrics(indexUtilizationInfo) {
        let result = "";
        result = this.writeBeforeIndexUtilizationInfo(result);
        result = this.writeIndexUtilizationInfo(result, indexUtilizationInfo);
        result = this.writeAfterIndexUtilizationInfo(result);
        return result;
    }
    writeBeforeIndexUtilizationInfo(result) {
        result = this.appendNewlineToResult(result);
        result = this.appendHeaderToResult(result, Constants.IndexUtilizationInfo, 0);
        return result;
    }
    writeIndexUtilizationInfo(result, indexUtilizationInfo) {
        result = this.appendHeaderToResult(result, Constants.UtilizedSingleIndexes, 1);
        for (const indexUtilizationEntity of indexUtilizationInfo.UtilizedSingleIndexes) {
            result = this.writeSingleIndexUtilizationEntity(result, indexUtilizationEntity);
        }
        result = this.appendHeaderToResult(result, Constants.PotentialSingleIndexes, 1);
        for (const indexUtilizationEntity of indexUtilizationInfo.PotentialSingleIndexes) {
            result = this.writeSingleIndexUtilizationEntity(result, indexUtilizationEntity);
        }
        result = this.appendHeaderToResult(result, Constants.UtilizedCompositeIndexes, 1);
        for (const indexUtilizationEntity of indexUtilizationInfo.UtilizedCompositeIndexes) {
            result = this.writeCompositeIndexUtilizationEntity(result, indexUtilizationEntity);
        }
        result = this.appendHeaderToResult(result, Constants.PotentialCompositeIndexes, 1);
        for (const indexUtilizationEntity of indexUtilizationInfo.PotentialCompositeIndexes) {
            result = this.writeCompositeIndexUtilizationEntity(result, indexUtilizationEntity);
        }
        return result;
    }
    writeAfterIndexUtilizationInfo(result) {
        return result;
    }
    writeSingleIndexUtilizationEntity(result, indexUtilizationEntity) {
        result = this.appendHeaderToResult(result, `${Constants.IndexExpression}: ${indexUtilizationEntity.IndexSpec}`, 2);
        result = this.appendHeaderToResult(result, `${Constants.IndexImpactScore}: ${indexUtilizationEntity.IndexImpactScore}`, 2);
        result = this.appendHeaderToResult(result, Constants.IndexUtilizationSeparator, 2);
        return result;
    }
    writeCompositeIndexUtilizationEntity(result, indexUtilizationEntity) {
        result = this.appendHeaderToResult(result, `${Constants.IndexExpression}: ${indexUtilizationEntity.IndexSpecs.join(", ")}`, 2);
        result = this.appendHeaderToResult(result, `${Constants.IndexImpactScore}: ${indexUtilizationEntity.IndexImpactScore}`, 2);
        result = this.appendHeaderToResult(result, Constants.IndexUtilizationSeparator, 2);
        return result;
    }
    appendNewlineToResult(result) {
        return this.appendHeaderToResult(result, "", 0);
    }
    appendHeaderToResult(result, headerTitle, indentLevel) {
        const Indent = "  ";
        const header = `${Indent.repeat(indentLevel)}${headerTitle}\n`;
        result += header;
        return result;
    }
}
//# sourceMappingURL=IndexMetricWriter.js.map