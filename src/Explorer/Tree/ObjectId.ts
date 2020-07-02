import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import DocumentId from "./DocumentId";

export default class ObjectId extends DocumentId implements ViewModels.DocumentId {
  constructor(container: ViewModels.DocumentsTab, data: any, partitionKeyValue: any) {
    super(container, data, partitionKeyValue);
    if (typeof data._id === "object") {
      this.id = ko.observable(data._id[Object.keys(data._id)[0]]);
    } else {
      this.id = ko.observable(data._id);
    }
  }
}
