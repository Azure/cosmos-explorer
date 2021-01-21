import * as ko from "knockout";
import * as ViewModels from "../Contracts/ViewModels";

export default class EditableUtility {
  public static observable<T>(initialValue?: T): ViewModels.Editable<T> {
    var observable: ViewModels.Editable<T> = <ViewModels.Editable<T>>ko.observable<T>(initialValue);

    observable.edits = ko.observableArray<T>([initialValue]);
    observable.validations = ko.observableArray<(value: T) => boolean>([]);

    observable.setBaseline = (baseline: T) => {
      observable(baseline);
      observable.edits([baseline]);
    };

    observable.getEditableCurrentValue = ko.computed<T>(() => {
      const edits = (observable.edits && observable.edits()) || [];
      if (edits.length === 0) {
        return undefined;
      }

      return edits[edits.length - 1];
    });

    observable.getEditableOriginalValue = ko.computed<T>(() => {
      const edits = (observable.edits && observable.edits()) || [];
      if (edits.length === 0) {
        return undefined;
      }

      return edits[0];
    });

    observable.editableIsDirty = ko.computed<boolean>(() => {
      const edits = (observable.edits && observable.edits()) || [];
      if (edits.length <= 1) {
        return false;
      }

      let current: any = observable.getEditableCurrentValue();
      let original: any = observable.getEditableOriginalValue();

      switch (typeof current) {
        case "string":
        case "undefined":
        case "number":
        case "boolean":
          current = current && current.toString();
          break;

        default:
          current = JSON.stringify(current);
          break;
      }

      switch (typeof original) {
        case "string":
        case "undefined":
        case "number":
        case "boolean":
          original = original && original.toString();
          break;

        default:
          original = JSON.stringify(original);
          break;
      }

      if (current !== original) {
        return true;
      }

      return false;
    });

    observable.subscribe(edit => {
      var edits = observable.edits && observable.edits();
      if (!edits) {
        return;
      }
      edits.push(edit);
      observable.edits(edits);
    });

    observable.editableIsValid = ko.observable<boolean>(true);
    observable.subscribe(value => {
      const validations: ((value: T) => boolean)[] = (observable.validations && observable.validations()) || [];
      const isValid = validations.every(validate => validate(value));
      observable.editableIsValid(isValid);
    });

    return observable;
  }
}
