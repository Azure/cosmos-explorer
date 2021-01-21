import * as ko from "knockout";
import { EditorNodePropertiesComponent } from "../GraphExplorerComponent/EditorNodePropertiesComponent";
import { NewVertexData, InputProperty } from "../../../Contracts/ViewModels";
import { WaitsForTemplateViewModel } from "../../WaitsForTemplateViewModel";
import * as Constants from "../../../Common/Constants";
import template from "./NewVertexComponent.html";

/**
 * Parameters for this component
 */
export interface NewVertexParams {
  // Data to be edited by the component
  newVertexData: ko.Observable<NewVertexData>;
  partitionKeyProperty: ko.Observable<string>;
  firstFieldHasFocus?: ko.Observable<boolean>;

  /**
   * Callback triggered when the template is bound to the component (for testing purposes)
   */
  onTemplateReady?: () => void;
}

export class NewVertexViewModel extends WaitsForTemplateViewModel {
  private static readonly DEFAULT_PROPERTY_TYPE = "string";

  private newVertexData: ko.Observable<NewVertexData>;
  private firstFieldHasFocus: ko.Observable<boolean>;
  private propertyTypes: string[];

  public constructor(params: NewVertexParams) {
    super();
    super.onTemplateReady((isTemplateReady: boolean) => {
      if (isTemplateReady && params.onTemplateReady) {
        params.onTemplateReady();
      }
    });

    this.newVertexData =
      params.newVertexData ||
      ko.observable({
        label: "",
        properties: <InputProperty[]>[]
      });
    this.firstFieldHasFocus = params.firstFieldHasFocus || ko.observable(false);
    this.propertyTypes = EditorNodePropertiesComponent.VERTEX_PROPERTY_TYPES;
    if (params.partitionKeyProperty) {
      params.partitionKeyProperty.subscribe((newKeyProp: string) => {
        if (!newKeyProp) {
          return;
        }
        this.addNewVertexProperty(newKeyProp);
      });
    }
  }

  public onAddNewProperty() {
    this.addNewVertexProperty();
    document.getElementById("propertyKeyNewVertexPane").focus();
  }

  public onAddNewPropertyKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.onAddNewProperty();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  public addNewVertexProperty(key?: string) {
    let ap = this.newVertexData().properties;
    ap.push({ key: key || "", values: [{ value: "", type: NewVertexViewModel.DEFAULT_PROPERTY_TYPE }] });
    this.newVertexData.valueHasMutated();
  }

  public removeNewVertexProperty(index: number) {
    let ap = this.newVertexData().properties;
    ap.splice(index, 1);
    this.newVertexData.valueHasMutated();
    document.getElementById("addProperyNewVertexBtn").focus();
  }

  public removeNewVertexPropertyKeyPress = (index: number, source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.removeNewVertexProperty(index);
      event.stopPropagation();
      return false;
    }
    return true;
  };
}

/**
 * Helper class for ko component registration
 */
export const NewVertexComponent = {
  viewModel: NewVertexViewModel,
  template
};
