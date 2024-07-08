import * as ko from "knockout";
import Q from "q";
import DiscardIcon from "../../../images/discard.svg";
import SaveIcon from "../../../images/save-cosmos.svg";
import * as Constants from "../../Common/Constants";
import editable from "../../Common/EditableUtility";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import { loadMonaco, monaco } from "../LazyMonaco";
import TabsBase from "./TabsBase";

export default abstract class ScriptTabBase extends TabsBase implements ViewModels.WaitsForTemplate {
  public ariaLabel: ko.Observable<string>;
  public editorState: ko.Observable<ViewModels.ScriptEditorState>;
  public id: ViewModels.Editable<string>;
  public editorContent: ViewModels.Editable<string>;
  public editorId: string;
  public editor: ko.Observable<monaco.editor.IStandaloneCodeEditor>;
  public executeButton: ViewModels.Button;
  public saveButton: ViewModels.Button;
  public updateButton: ViewModels.Button;
  public discardButton: ViewModels.Button;
  public deleteButton: ViewModels.Button;
  public errors: ko.ObservableArray<ViewModels.QueryError>;
  public statusMessge: ko.Observable<string>;
  public statusIcon: ko.Observable<string>;
  public formFields: ko.ObservableArray<ViewModels.Editable<any>>;
  public formIsValid: ko.Computed<boolean>;
  public formIsDirty: ko.Computed<boolean>;
  public isNew: ko.Observable<boolean>;
  // TODO: Remove any. The SDK types for all the script.body are slightly incorrect which makes this REALLY hard to type correct.
  public resource: ko.Observable<any>;
  public isTemplateReady: ko.Observable<boolean>;
  protected _partitionKey: DataModels.PartitionKey;

  constructor(options: ViewModels.ScriptTabOption) {
    super(options);
    this._partitionKey = options.partitionKey;
    this.isNew = ko.observable(options.isNew);
    this.resource = ko.observable(options.resource);
    this.isTemplateReady = ko.observable<boolean>(false);
    this.isTemplateReady.subscribe((isTemplateReady: boolean) => {
      if (isTemplateReady) {
        // setTimeout is needed as creating the edtior manipulates the dom directly and expects
        // Knockout to have completed all of the initial bindings for the component
        setTimeout(() => this._createBodyEditor(), Constants.ClientDefaults.waitForDOMElementMs);
      }
    });

    this.editorId = `editor_${this.tabId}`;
    this.ariaLabel = ko.observable<string>();
    if (this.isNew()) {
      this.editorState = ko.observable(ViewModels.ScriptEditorState.newInvalid);
    } else {
      this.editorState = ko.observable(ViewModels.ScriptEditorState.existingNoEdits);
    }

    this.id = editable.observable<string>();
    this.id.validations([ScriptTabBase._isValidId]);

    this.editorContent = editable.observable<string>();
    this.editorContent.validations([ScriptTabBase._isNotEmpty]);

    this.formFields = ko.observableArray([this.id, this.editorContent]);

    this._setBaselines();

    this.id.editableIsValid.subscribe((isValid) => {
      const currentState = this.editorState();
      switch (currentState) {
        case ViewModels.ScriptEditorState.newValid:
        case ViewModels.ScriptEditorState.newInvalid:
          if (isValid) {
            this.editorState(ViewModels.ScriptEditorState.newValid);
          } else {
            this.editorState(ViewModels.ScriptEditorState.newInvalid);
          }
          break;
        case ViewModels.ScriptEditorState.existingDirtyInvalid:
        case ViewModels.ScriptEditorState.existingDirtyValid:
          if (isValid) {
            this.editorState(ViewModels.ScriptEditorState.existingDirtyValid);
          } else {
            this.editorState(ViewModels.ScriptEditorState.existingDirtyInvalid);
          }
          break;
        case ViewModels.ScriptEditorState.existingDirtyValid:
        default:
          break;
      }
    });

    this.editor = ko.observable<monaco.editor.IStandaloneCodeEditor>();

    this.formIsValid = ko.computed<boolean>(() => {
      const formIsValid: boolean = this.formFields().every((field) => {
        return field.editableIsValid();
      });

      return formIsValid;
    });

    this.formIsDirty = ko.computed<boolean>(() => {
      const formIsDirty: boolean = this.formFields().some((field) => {
        return field.editableIsDirty();
      });

      return formIsDirty;
    });

    this.saveButton = {
      enabled: ko.computed<boolean>(() => {
        if (!this.formIsValid()) {
          return false;
        }

        if (!this.formIsDirty()) {
          return false;
        }

        return true;
      }),

      visible: ko.computed<boolean>(() => {
        return this.isNew();
      }),
    };

    this.updateButton = {
      enabled: ko.computed<boolean>(() => {
        if (!this.formIsValid()) {
          return false;
        }

        if (!this.formIsDirty()) {
          return false;
        }

        return true;
      }),

      visible: ko.computed<boolean>(() => {
        return !this.isNew();
      }),
    };

    this.discardButton = {
      enabled: ko.computed<boolean>(() => {
        return this.formIsDirty();
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    this.deleteButton = {
      enabled: ko.computed<boolean>(() => {
        return !this.isNew();
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    this.executeButton = {
      enabled: ko.computed<boolean>(() => {
        return !this.isNew() && !this.formIsDirty() && this.formIsValid();
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };
  }

  private _setBaselines() {
    const resource = this.resource();
    this.id.setBaseline(resource.id);
    this.editorContent.setBaseline(resource.body);
  }

  public setBaselines() {
    this._setBaselines();
  }

  public onTabClick(): void {
    super.onTabClick();
    if (this.isNew()) {
      this.collection.selectedSubnodeKind(this.tabKind);
    }
  }

  public abstract onSaveClick: () => void;
  public abstract onUpdateClick: () => Promise<any>;

  public onDiscard = (): Q.Promise<any> => {
    this.setBaselines();
    const original = this.editorContent.getEditableOriginalValue();
    const editorModel = this.editor() && this.editor().getModel();
    editorModel && editorModel.setValue(original);

    return Q();
  };

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    const label = "Save";
    if (this.saveButton.visible()) {
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: this.onSaveClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.saveButton.enabled(),
      });
    }

    if (this.updateButton.visible()) {
      const label = "Update";
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: this.onUpdateClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.updateButton.enabled(),
      });
    }

    if (this.discardButton.visible()) {
      const label = "Discard";
      buttons.push({
        iconSrc: DiscardIcon,
        iconAlt: label,
        onCommandClick: this.onDiscard,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.discardButton.enabled(),
      });
    }
    return buttons;
  }

  protected buildCommandBarOptions(): void {
    ko.computed(() =>
      ko.toJSON([
        this.saveButton.visible,
        this.saveButton.enabled,
        this.updateButton.visible,
        this.updateButton.enabled,
        this.discardButton.visible,
        this.discardButton.enabled,
      ]),
    ).subscribe(() => this.updateNavbarWithTabsButtons());
    this.updateNavbarWithTabsButtons();
  }

  private static _isValidId(id: string): boolean {
    if (!id) {
      return false;
    }

    const invalidStartCharacters = /^[/?#\\]/;
    if (invalidStartCharacters.test(id)) {
      return false;
    }

    const invalidMiddleCharacters = /^.+[/?#\\]/;
    if (invalidMiddleCharacters.test(id)) {
      return false;
    }

    const invalidEndCharacters = /.*[/?#\\ ]$/;
    if (invalidEndCharacters.test(id)) {
      return false;
    }

    return true;
  }

  private static _isNotEmpty(value: string): boolean {
    return !!value;
  }

  protected async _createBodyEditor() {
    const id = this.editorId;
    const container = document.getElementById(id);
    const options = {
      value: this.editorContent(),
      language: "javascript",
      readOnly: false,
      ariaLabel: this.ariaLabel(),
    };

    container.innerHTML = "";
    const monaco = await loadMonaco();
    const editor = monaco.editor.create(container, options);
    this.editor(editor);

    const editorModel = editor.getModel();
    editorModel.onDidChangeContent(this._onBodyContentChange.bind(this));
  }

  private _onBodyContentChange(e: monaco.editor.IModelContentChangedEvent) {
    const editorModel = this.editor().getModel();
    this.editorContent(editorModel.getValue());
  }
}
