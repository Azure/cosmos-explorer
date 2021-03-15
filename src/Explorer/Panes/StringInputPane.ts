import * as ko from "knockout";
import Q from "q";
import * as ViewModels from "../../Contracts/ViewModels";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";

export interface StringInputPaneOpenOptions {
  paneTitle: string;
  inputLabel: string;
  errorMessage: string;
  inProgressMessage: string;
  successMessage: string;
  onSubmit: (input: string) => Promise<any>;
  submitButtonLabel: string;
  defaultInput?: string;
}

/**
 * Generic pane to get a single string input from user
 */
export class StringInputPane extends ContextualPaneBase {
  private openOptions: StringInputPaneOpenOptions;
  private submitButtonLabel: ko.Observable<string>;
  private inputLabel: ko.Observable<string>;
  private stringInput: ko.Observable<string>;

  private paneDeferred: Q.Deferred<any>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.resetData();
    this.inputLabel = ko.observable("");
    this.submitButtonLabel = ko.observable("Load");
    this.stringInput = ko.observable();
  }

  public submit() {
    this.formErrors("");
    this.formErrorsDetails("");

    const id: string = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `${this.openOptions.inProgressMessage} ${this.stringInput()}`
    );
    this.isExecuting(true);
    this.openOptions
      .onSubmit(this.stringInput())
      .then(
        (value: any) => {
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Info,
            `${this.openOptions.successMessage}: ${this.stringInput()}`
          );
          this.close();
          this.paneDeferred.resolve(value);
        },
        (reason) => {
          let error = reason;
          if (reason instanceof Error) {
            error = reason.message;
          } else if (typeof reason === "object") {
            error = JSON.stringify(reason);
          }

          // If it's an AjaxError (AjaxObservable), add more error
          if (reason.response && reason.response.message) {
            error += `. ${reason.response.message}`;
          }

          this.formErrors(this.openOptions.errorMessage);
          this.formErrorsDetails(`${this.openOptions.errorMessage}: ${error}`);
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `${this.openOptions.errorMessage} ${this.stringInput()}: ${error}`
          );
          this.paneDeferred.reject(error);
        }
      )
      .finally(() => {
        this.isExecuting(false);
        NotificationConsoleUtils.clearInProgressMessageWithId(id);
      });
  }

  public close() {
    super.close();
    this.resetData();
    this.resetFileInput();
  }

  public openWithOptions<T>(options: StringInputPaneOpenOptions): Q.Promise<T> {
    this.openOptions = options;
    this.title(this.openOptions.paneTitle);
    if (this.openOptions.submitButtonLabel) {
      this.submitButtonLabel(this.openOptions.submitButtonLabel);
    }
    this.inputLabel(this.openOptions.inputLabel);
    this.stringInput(this.openOptions.defaultInput);

    super.open();
    this.paneDeferred = Q.defer<T>();
    return this.paneDeferred.promise;
  }

  private resetFileInput(): void {
    this.stringInput("");
  }
}
