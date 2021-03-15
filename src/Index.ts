import * as ko from "knockout";
import "../less/index.less";
import "./Libs/jquery";

class Index {
  public navigationSelection: ko.Observable<string>;

  constructor() {
    this.navigationSelection = ko.observable("quickstart");
  }

  public quickstart_click() {
    this.navigationSelection("quickstart");
  }

  public explorer_click() {
    this.navigationSelection("explorer");
  }
}

var index = new Index();
ko.applyBindings(index);
