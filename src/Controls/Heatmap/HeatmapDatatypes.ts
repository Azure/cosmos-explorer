type dataPoint = string | number;

export interface DataPayload {
  [id: string]: PartitionTimeStampToData;
}

export enum PortalTheme {
  blue = 1,
  azure,
  light,
  dark
}

export interface HeatmapData {
  yAxisPoints: string[];
  xAxisPoints: string[];
  dataPoints: dataPoint[][];
}

export interface HeatmapCaptions {
  chartTitle: string;
  yAxisTitle: string;
  tooltipText: string;
  timeWindow: number;
}

export interface FontSettings {
  family: string;
  size: number;
  color: string;
}

export interface LayoutSettings {
  paper_bgcolor?: string;
  plot_bgcolor?: string;
  margin?: {
    l: number;
    r: number;
    b: number;
    t: number;
    pad: number;
  };
  width?: number;
  height?: number;
  yaxis?: {
    fixedrange: boolean;
    title: HeatmapCaptions["yAxisTitle"];
    titlefont: FontSettings;
    autorange: boolean;
    showgrid: boolean;
    zeroline: boolean;
    showline: boolean;
    autotick: boolean;
    ticks: "";
    showticklabels: boolean;
  };
  xaxis?: {
    fixedrange: boolean;
    title: string;
    titlefont: FontSettings;
    autorange: boolean;
    showgrid: boolean;
    zeroline: boolean;
    showline: boolean;
    autotick: boolean;
    showticklabels: boolean;
    tickformat: string;
    tickfont: FontSettings;
  };
  title?: {
    text: HeatmapCaptions["chartTitle"];
    x: number;
    font?: FontSettings;
  };
  font?: FontSettings;
}

export interface ChartSettings {
  z: HeatmapData["dataPoints"];
  type: "heatmap";
  zmin: number;
  zmid: number;
  zmax: number;
  colorscale: [number, string][];
  name: string;
  hovertemplate: HeatmapCaptions["tooltipText"];
  colorbar: {
    thickness: number;
    outlinewidth: number;
    tickcolor: string;
    tickfont: FontSettings;
  };
  y: HeatmapData["yAxisPoints"];
  x: HeatmapData["xAxisPoints"];
}

export interface DisplaySettings {
  displayModeBar: boolean;
  responsive?: boolean;
}

export interface PartitionTimeStampToData {
  [timeSeriesDates: string]: {
    [NormalizedThroughput: string]: number;
  };
}
