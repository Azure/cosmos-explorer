import * as ko from "knockout";
import DocumentsTab from "../Tabs/DocumentsTab";
import DocumentId from "./DocumentId";

export default class ObjectId extends DocumentId {
  constructor(container: DocumentsTab, data: any, partitionKeyValue: any) {
    super(container, data, partitionKeyValue);
    if (typeof data._id === "object") {
      this.id = ko.observable(data._id[Object.keys(data._id)[0]]);
    } else {
      this.id = ko.observable(data._id);
    }
  }
}
