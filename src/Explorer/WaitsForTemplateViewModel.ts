import * as ko from "knockout";
import * as ViewModels from "../Contracts/ViewModels";
import * as Constants from "../Common/Constants";

export abstract class WaitsForTemplateViewModel implements ViewModels.WaitsForTemplate {
  public isTemplateReady: ko.Observable<boolean>;

  constructor() {
    this.isTemplateReady = ko.observable(false).extend({ rateLimit: 100 });
  }

  protected onTemplateReady(callback: (isTemplateReady: boolean) => void) {
    this.isTemplateReady.subscribe((value: boolean) => {
      callback(value);
    });

    document.addEventListener("keydown", function(e: KeyboardEvent) {
      // To trap keyboard focus in AddCollection pane
      let firstFocusableElement = document.getElementById("closeBtnAddCollection");
      let lastFocusableElement = document.getElementById("submitBtnAddCollection");
      var isTabPressed = e.keyCode === Constants.KeyCodes.Tab;
      if (isTabPressed) {
        if (e.shiftKey) {
          /* shift + tab */ if (document.activeElement === firstFocusableElement) {
            lastFocusableElement && lastFocusableElement.focus();
            e.preventDefault();
          }
        } /* tab */ else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement && firstFocusableElement.focus();
            e.preventDefault();
          }
        }
      }
    });
  }
}
