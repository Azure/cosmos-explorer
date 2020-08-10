import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";

export function replaceKnownError(err: string): string {
  if (
    window.dataExplorer.subscriptionType() === ViewModels.SubscriptionType.Internal &&
    err.indexOf("SharedOffer is Disabled for your account") >= 0
  ) {
    return "Database throughput is not supported for internal subscriptions.";
  } else if (err.indexOf("Partition key paths must contain only valid") >= 0) {
    return "Partition key paths must contain only valid characters and not contain a trailing slash or wildcard character.";
  }

  return err;
}

export function parse(err: any): DataModels.ErrorDataModel[] {
  try {
    return _parse(err);
  } catch (e) {
    return [<DataModels.ErrorDataModel>{ message: JSON.stringify(err) }];
  }
}

function _parse(err: any): DataModels.ErrorDataModel[] {
  var normalizedErrors: DataModels.ErrorDataModel[] = [];
  if (err.message && !err.code) {
    normalizedErrors.push(err);
  } else {
    const innerErrors: any[] = _getInnerErrors(err.message);
    normalizedErrors = innerErrors.map(innerError =>
      typeof innerError === "string" ? { message: innerError } : innerError
    );
  }

  return normalizedErrors;
}

function _getInnerErrors(message: string): any[] {
  /*
            The backend error message has an inner-message which is a stringified object. 

            For SQL errors, the "errors" property is an array of SqlErrorDataModel.
            Example:
                "Message: {"Errors":["Resource with specified id or name already exists"]}\r\nActivityId: 80005000008d40b6a, Request URI: /apps/19000c000c0a0005/services/mctestdocdbprod-MasterService-0-00066ab9937/partitions/900005f9000e676fb8/replicas/13000000000955p"
            For non-SQL errors the "Errors" propery is an array of string.
            Example:
                "Message: {"errors":[{"severity":"Error","location":{"start":7,"end":8},"code":"SC1001","message":"Syntax error, incorrect syntax near '.'."}]}\r\nActivityId: d3300016d4084e310a, Request URI: /apps/12401f9e1df77/services/dc100232b1f44545/partitions/f86f3bc0001a2f78/replicas/13085003638s"
        */

  let innerMessage: any = null;

  const singleLineMessage = message.replace(/[\r\n]|\r|\n/g, "");
  try {
    // Multi-Partition error flavor
    const regExp = /^(.*)ActivityId: (.*)/g;
    const regString = regExp.exec(singleLineMessage);
    const innerMessageString = regString[1];
    innerMessage = JSON.parse(innerMessageString);
  } catch (e) {
    // Single-partition error flavor
    const regExp = /^Message: (.*)ActivityId: (.*), Request URI: (.*)/g;
    const regString = regExp.exec(singleLineMessage);
    const innerMessageString = regString[1];
    innerMessage = JSON.parse(innerMessageString);
  }

  return innerMessage.errors ? innerMessage.errors : innerMessage.Errors;
}
