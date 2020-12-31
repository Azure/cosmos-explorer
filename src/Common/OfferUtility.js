"use strict";
exports.__esModule = true;
exports.parseSDKOfferResponse = void 0;
var Constants_1 = require("./Constants");
var parseSDKOfferResponse = function (offerResponse) {
    var _a, _b, _c;
    var offerDefinition = offerResponse === null || offerResponse === void 0 ? void 0 : offerResponse.resource;
    var offerContent = offerDefinition.content;
    if (!offerContent) {
        return undefined;
    }
    var minimumThroughput = (_a = offerContent.collectionThroughputInfo) === null || _a === void 0 ? void 0 : _a.minimumRUForCollection;
    var autopilotSettings = offerContent.offerAutopilotSettings;
    if (autopilotSettings) {
        return {
            id: offerDefinition.id,
            autoscaleMaxThroughput: autopilotSettings.maxThroughput,
            manualThroughput: undefined,
            minimumThroughput: minimumThroughput,
            offerDefinition: offerDefinition,
            offerReplacePending: ((_b = offerResponse.headers) === null || _b === void 0 ? void 0 : _b[Constants_1.HttpHeaders.offerReplacePending]) === "true"
        };
    }
    return {
        id: offerDefinition.id,
        autoscaleMaxThroughput: undefined,
        manualThroughput: offerContent.offerThroughput,
        minimumThroughput: minimumThroughput,
        offerDefinition: offerDefinition,
        offerReplacePending: ((_c = offerResponse.headers) === null || _c === void 0 ? void 0 : _c[Constants_1.HttpHeaders.offerReplacePending]) === "true"
    };
};
exports.parseSDKOfferResponse = parseSDKOfferResponse;
