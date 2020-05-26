import * as ViewModels from "../../../Contracts/ViewModels";
import TabsBase from "../TabsBase";

export default class NotebookTab extends TabsBase implements ViewModels.Tab {
  constructor(options: ViewModels.NotebookTabOptions) {
    super(options);
  }
}
