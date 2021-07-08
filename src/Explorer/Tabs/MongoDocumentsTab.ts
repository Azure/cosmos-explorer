import * as ViewModels from "../../Contracts/ViewModels";
import DocumentsTab from "./DocumentsTab";

export default class MongoDocumentsTab extends DocumentsTab {
  public collection: ViewModels.Collection;
  constructor(options: ViewModels.DocumentsTabOptions) {
    super(options);
    if (this.partitionKeyProperty && ~this.partitionKeyProperty.indexOf(`"`)) {
      this.partitionKeyProperty = this.partitionKeyProperty.replace(/["]+/g, "");
    }

    if (this.partitionKeyProperty && this.partitionKeyProperty.indexOf("$v") > -1) {
      // From $v.shard.$v.key.$v > shard.key
      this.partitionKeyProperty = this.partitionKeyProperty.replace(/.\$v/g, "").replace(/\$v./g, "");
      this.partitionKeyPropertyHeader = "/" + this.partitionKeyProperty;
    }

    super.buildCommandBarOptions.bind(this);
    super.buildCommandBarOptions();
  }
}
