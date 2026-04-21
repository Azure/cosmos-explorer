// This replicates transform loading from:
// https://github.com/nteract/nteract/blob/master/applications/jupyter-extension/nteract_on_jupyter/app/contents/notebook.tsx

export default (props: { addTransform: (component: unknown) => void }): void => {
  import(/* webpackChunkName: "plotly" */ "@nteract/transform-plotly").then((module) => {
    props.addTransform(module.default);
    props.addTransform(module.PlotlyNullTransform);
  });

  import(/* webpackChunkName: "tabular-dataresource" */ "@nteract/data-explorer").then((module) => {
    props.addTransform(module.default);
  });

  import(/* webpackChunkName: "jupyter-widgets" */ "@nteract/jupyter-widgets").then((module) => {
    props.addTransform(module.WidgetDisplay);
  });

  import("@nteract/transform-model-debug").then((module) => {
    props.addTransform(module.default);
  });

  import(/* webpackChunkName: "vega-transform" */ "@nteract/transform-vega").then((module) => {
    props.addTransform(module.VegaLite1);
    props.addTransform(module.VegaLite2);
    props.addTransform(module.VegaLite3);
    props.addTransform(module.VegaLite4);
    props.addTransform(module.Vega2);
    props.addTransform(module.Vega3);
    props.addTransform(module.Vega4);
    props.addTransform(module.Vega5);
  });

  // TODO: The geojson transform will likely need some work because of the basemap URL(s)
  // import GeoJSONTransform from "@nteract/transform-geojson";
};
