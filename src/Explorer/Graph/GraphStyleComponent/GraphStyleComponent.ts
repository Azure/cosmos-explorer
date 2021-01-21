import * as Constants from "../../../Common/Constants";
import * as ViewModels from "../../../Contracts/ViewModels";
import { WaitsForTemplateViewModel } from "../../WaitsForTemplateViewModel";

/**
 * Parameters for this component
 */
export interface GraphStyleParams {
  config: ViewModels.GraphConfigUiData;
  firstFieldHasFocus?: ko.Observable<boolean>;

  /**
   * Callback triggered when the template is bound to the component (for testing purposes)
   */
  onTemplateReady?: () => void;
}

class GraphStyleViewModel extends WaitsForTemplateViewModel {
  private params: GraphStyleParams;

  public constructor(params: GraphStyleParams) {
    super();
    super.onTemplateReady((isTemplateReady: boolean) => {
      if (isTemplateReady && params.onTemplateReady) {
        params.onTemplateReady();
      }
    });

    this.params = params;
  }

  public onAllNeighborsKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.params.config.showNeighborType(ViewModels.NeighborType.BOTH);
      event.stopPropagation();
      return false;
    }

    return true;
  };

  public onSourcesKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.params.config.showNeighborType(ViewModels.NeighborType.SOURCES_ONLY);
      event.stopPropagation();
      return false;
    }

    return true;
  };

  public onTargetsKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.params.config.showNeighborType(ViewModels.NeighborType.TARGETS_ONLY);
      event.stopPropagation();
      return false;
    }

    return true;
  };
}

const template = `
<div id="graphStyle" class="graphStyle" data-bind="setTemplateReady: true, with:params.config">
    <div class="seconddivpadding">
        <p>Show vertex (node) as</p>
        <select id="nodeCaptionChoices" class="formTree paneselect" required data-bind="options:nodeProperties,
                                            value:nodeCaptionChoice, hasFocus: $parent.params.firstFieldHasFocus"></select>
    </div>
    <div class="seconddivpadding">
        <p>Map this property to node color</p>
        <select id="nodeColorKeyChoices" class="formTree paneselect" required data-bind="options:nodePropertiesWithNone,
                                                                            value:nodeColorKeyChoice"></select>
    </div>
    <div class="seconddivpadding">
        <p>Map this property to node icon</p>
        <select id="nodeIconChoices" class="formTree paneselect" required data-bind="options:nodePropertiesWithNone,
                                                                            value:nodeIconChoice"></select>
        <input type="text" data-bind="value:nodeIconSet" placeholder="Icon set: blank for collection id" class="nodeIconSet" autocomplete="off" />
    </div>

    <p class="seconddivpadding">Show</p>

    <div class="tabs">
        <div class="tab">
            <input type="radio" id="tab11" name="graphneighbortype" class="radio" data-bind="checkedValue:2, checked:showNeighborType" />
            <label for="tab11" tabindex="0" data-bind="event: { keypress: $parent.onAllNeighborsKeyPress }">All neighbors</label>
        </div>
        <div class="tab">
            <input type="radio" id="tab12" name="graphneighbortype" class="radio" data-bind="checkedValue:0, checked:showNeighborType" />
            <label for="tab12" tabindex="0" data-bind="event: { keypress: $parent.onSourcesKeyPress }">Sources</label>
        </div>
        <div class="tab">
            <input type="radio" id="tab13" name="graphneighbortype" class="radio" data-bind="checkedValue:1, checked:showNeighborType" />
            <label for="tab13" tabindex="0" data-bind="event: { keypress: $parent.onTargetsKeyPress }">Targets</label>
        </div>
    </div>
</div>`;

export const GraphStyleComponent = {
  viewModel: GraphStyleViewModel,
  template
};
