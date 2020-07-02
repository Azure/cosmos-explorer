import "../less/index.less";
import "./Libs/jquery";

import * as ko from "knockout";
import { CorrelationBackend } from "./Common/Constants";
import Ajax from "./Shared/Ajax";

class Index {
  public navigationSelection: ko.Observable<string>;
  public correlationSrc: ko.Observable<string>;

  constructor() {
    this.navigationSelection = ko.observable("quickstart");
    this.correlationSrc = ko.observable("");

    Ajax.get("/_explorer/installation_id.txt").then((result) => {
      // TODO: Detect correct URL for each environment automatically.
      const url: string = `${CorrelationBackend.Url}?emulator_id=${result}`;
      this.correlationSrc(url);
    });
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
