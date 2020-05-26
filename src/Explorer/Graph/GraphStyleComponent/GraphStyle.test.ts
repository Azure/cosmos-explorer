import * as ko from "knockout";
import { GraphStyleComponent, GraphStyleParams } from "./GraphStyleComponent";
import * as ViewModels from "../../../Contracts/ViewModels";

function buildComponent(buttonOptions: any) {
  document.body.innerHTML = GraphStyleComponent.template as any;
  const vm = new GraphStyleComponent.viewModel(buttonOptions);
  ko.applyBindings(vm);
}

describe("Graph Style Component", () => {
  let buildParams = (config: ViewModels.GraphConfigUiData): GraphStyleParams => {
    return {
      config: config
    };
  };

  afterEach(() => {
    ko.cleanNode(document);
  });

  describe("Rendering", () => {
    it("should display proper list of choices passed in component parameters", () => {
      const PROP2 = "prop2";
      const PROPC = "prop3";
      const params = buildParams({
        nodeCaptionChoice: ko.observable(null),
        nodeIconChoice: ko.observable(null),
        nodeColorKeyChoice: ko.observable(null),
        nodeIconSet: ko.observable(null),
        nodeProperties: ko.observableArray(["prop1", PROP2]),
        nodePropertiesWithNone: ko.observableArray(["propa", "propb", PROPC]),
        showNeighborType: ko.observable(null)
      });

      buildComponent(params);

      var e: any = document.querySelector(".graphStyle #nodeCaptionChoices");
      expect(e.options.length).toBe(2);
      expect(e.options[1].value).toBe(PROP2);

      e = document.querySelector(".graphStyle #nodeColorKeyChoices");
      expect(e.options.length).toBe(3);
      expect(e.options[2].value).toBe(PROPC);

      e = document.querySelector(".graphStyle #nodeIconChoices");
      expect(e.options.length).toBe(3);
      expect(e.options[2].value).toBe(PROPC);
    });
  });
});
