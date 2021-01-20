import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import { ContextualPaneBase } from "./ContextualPaneBase";

export default class GraphStylingPane extends ContextualPaneBase {
  public graphConfigUIData: ViewModels.GraphConfigUiData;
  private remoteConfig: ViewModels.GraphConfigUiData;

  constructor(options: ViewModels.PaneOptions) {
    super(options);

    this.graphConfigUIData = {
      showNeighborType: ko.observable(ViewModels.NeighborType.TARGETS_ONLY),
      nodeProperties: ko.observableArray([]),
      nodePropertiesWithNone: ko.observableArray([]),
      nodeCaptionChoice: ko.observable(null),
      nodeColorKeyChoice: ko.observable(null),
      nodeIconChoice: ko.observable(null),
      nodeIconSet: ko.observable(null),
    };

    this.graphConfigUIData.nodeCaptionChoice.subscribe((val) => {
      if (this.remoteConfig) {
        this.remoteConfig.nodeCaptionChoice(val);
      }
    });
    this.graphConfigUIData.nodeColorKeyChoice.subscribe((val) => {
      if (this.remoteConfig) {
        this.remoteConfig.nodeColorKeyChoice(val);
      }
    });
    this.graphConfigUIData.nodeIconChoice.subscribe((val) => {
      if (this.remoteConfig) {
        this.remoteConfig.nodeIconChoice(val);
      }
    });
    this.graphConfigUIData.nodeIconSet.subscribe((val) => {
      if (this.remoteConfig) {
        this.remoteConfig.nodeIconSet(val);
      }
    });
    this.graphConfigUIData.showNeighborType.subscribe((val) => {
      if (this.remoteConfig) {
        this.remoteConfig.showNeighborType(val);
      }
    });
  }

  public setData(config: ViewModels.GraphConfigUiData): void {
    // Update pane ko's with config's ko
    this.graphConfigUIData.nodeIconChoice(config.nodeIconChoice());
    this.graphConfigUIData.nodeIconSet(config.nodeIconSet());
    this.graphConfigUIData.nodeProperties(config.nodeProperties());
    this.graphConfigUIData.nodePropertiesWithNone(config.nodePropertiesWithNone());
    this.graphConfigUIData.showNeighborType(config.showNeighborType());
    // Make sure these two happen *after* setting the options of the dropdown,
    // otherwise, the ko will not get set if the choice is not part of the options
    this.graphConfigUIData.nodeCaptionChoice(config.nodeCaptionChoice());
    this.graphConfigUIData.nodeColorKeyChoice(config.nodeColorKeyChoice());

    this.remoteConfig = config;
  }

  public close() {
    this.remoteConfig = null;
    super.close();
  }
}
