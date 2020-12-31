"use strict";
exports.__esModule = true;
exports.SparkClusterEndpointKind = exports.ConflictResolutionMode = exports.ApiKind = void 0;
var ApiKind;
(function (ApiKind) {
    ApiKind[ApiKind["SQL"] = 0] = "SQL";
    ApiKind[ApiKind["MongoDB"] = 1] = "MongoDB";
    ApiKind[ApiKind["Table"] = 2] = "Table";
    ApiKind[ApiKind["Cassandra"] = 3] = "Cassandra";
    ApiKind[ApiKind["Graph"] = 4] = "Graph";
    ApiKind[ApiKind["MongoDBCompute"] = 5] = "MongoDBCompute";
})(ApiKind = exports.ApiKind || (exports.ApiKind = {}));
var ConflictResolutionMode;
(function (ConflictResolutionMode) {
    ConflictResolutionMode["Custom"] = "Custom";
    ConflictResolutionMode["LastWriterWins"] = "LastWriterWins";
})(ConflictResolutionMode = exports.ConflictResolutionMode || (exports.ConflictResolutionMode = {}));
var SparkClusterEndpointKind;
(function (SparkClusterEndpointKind) {
    SparkClusterEndpointKind["SparkUI"] = "SparkUI";
    SparkClusterEndpointKind["HistoryServerUI"] = "HistoryServerUI";
    SparkClusterEndpointKind["Livy"] = "Livy";
})(SparkClusterEndpointKind = exports.SparkClusterEndpointKind || (exports.SparkClusterEndpointKind = {}));
