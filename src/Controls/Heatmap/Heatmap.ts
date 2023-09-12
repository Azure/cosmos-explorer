import dayjs from "dayjs";
import * as Plotly from "plotly.js-cartesian-dist-min";
import { sendCachedDataMessage, sendReadyMessage } from "../../Common/MessageHandler";
import { StyleConstants } from "../../Common/StyleConstants";
import { MessageTypes } from "../../Contracts/ExplorerContracts";
import { isInvalidParentFrameOrigin } from "../../Utils/MessageValidation";
import "./Heatmap.less";
import {
  ChartSettings,
  DataPayload,
  DisplaySettings,
  FontSettings,
  HeatmapCaptions,
  HeatmapData,
  LayoutSettings,
  PartitionTimeStampToData,
  PortalTheme,
} from "./HeatmapDatatypes";

export class Heatmap {
  public static readonly elementId: string = "heatmap";

  private _chartData: HeatmapData;
  private _heatmapCaptions: HeatmapCaptions;
  private _theme: PortalTheme;
  private _defaultFontColor: string;

  constructor(data: DataPayload, heatmapCaptions: HeatmapCaptions, theme: PortalTheme) {
    this._theme = theme;
    this._defaultFontColor = StyleConstants.BaseDark;
    this._setThemeColorForChart();
    this._chartData = this.generateMatrixFromMap(data);
    this._heatmapCaptions = heatmapCaptions;
  }

  private _setThemeColorForChart() {
    if (isDarkTheme(this._theme)) {
      this._defaultFontColor = StyleConstants.BaseLight;
    }
  }

  private _getFontStyles(size: number = StyleConstants.MediumFontSize, color = "#838383"): FontSettings {
    return {
      family: StyleConstants.DataExplorerFont,
      size,
      color,
    };
  }

  public generateMatrixFromMap(data: DataPayload): HeatmapData {
    // all keys in data payload, sorted...
    const rows: string[] = Object.keys(data).sort((a: string, b: string) => {
      if (parseInt(a) < parseInt(b)) {
        return -1;
      } else {
        if (parseInt(a) > parseInt(b)) {
          return 1;
        } else {
          return 0;
        }
      }
    });
    const output: HeatmapData = {
      yAxisPoints: [],
      dataPoints: [],
      xAxisPoints: Object.keys(data[rows[0]]).sort((a: string, b: string) => {
        if (a < b) {
          return -1;
        } else {
          if (a > b) {
            return 1;
          } else {
            return 0;
          }
        }
      }),
    };
    // go thru all rows and create 2d matrix for heatmap...
    for (let i = 0; i < rows.length; i++) {
      output.yAxisPoints.push(rows[i]);
      const dataPoints: number[] = [];
      for (let a = 0; a < output.xAxisPoints.length; a++) {
        const row: PartitionTimeStampToData = data[rows[i]];
        dataPoints.push(row[output.xAxisPoints[a]]["Normalized Throughput"]);
      }
      output.dataPoints.push(dataPoints);
    }
    for (let a = 0; a < output.xAxisPoints.length; a++) {
      const dateTime = output.xAxisPoints[a];
      // convert to local users timezone...
      const day = dayjs(new Date(dateTime)).format("YYYY-MM-DD");
      const hour = dayjs(new Date(dateTime)).format("HH:mm:ss");
      // coerce to ISOString format since that is what plotly wants...
      output.xAxisPoints[a] = `${day}T${hour}Z`;
    }
    return output;
  }

  private _getChartSettings(): ChartSettings[] {
    return [
      {
        z: this._chartData.dataPoints,
        type: "heatmap",
        zmin: 0,
        zmid: 50,
        zmax: 100,
        colorscale: [
          [0.0, "#1FD338"],
          [0.1, "#1CAD2F"],
          [0.2, "#50A527"],
          [0.3, "#719F21"],
          [0.4, "#95991B"],
          [0.5, "#CE8F11"],
          [0.6, "#E27F0F"],
          [0.7, "#E46612"],
          [0.8, "#E64914"],
          [0.9, "#B80016"],
          [1.0, "#B80016"],
        ],
        name: "",
        hovertemplate: this._heatmapCaptions.tooltipText,
        colorbar: {
          thickness: 15,
          outlinewidth: 0,
          tickcolor: StyleConstants.BaseDark,
          tickfont: this._getFontStyles(10, this._defaultFontColor),
        },
        y: this._chartData.yAxisPoints,
        x: this._chartData.xAxisPoints,
      },
    ];
  }

  private _getLayoutSettings(): LayoutSettings {
    return {
      margin: {
        l: 40,
        r: 10,
        b: 35,
        t: 30,
        pad: 0,
      },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      width: 462,
      height: 240,
      yaxis: {
        title: this._heatmapCaptions.yAxisTitle,
        titlefont: this._getFontStyles(11),
        autorange: true,
        showgrid: false,
        zeroline: false,
        showline: false,
        autotick: true,
        fixedrange: true,
        ticks: "",
        showticklabels: false,
      },
      xaxis: {
        fixedrange: true,
        title: "*White area in heatmap indicates there is no available data",
        titlefont: this._getFontStyles(11),
        autorange: true,
        showgrid: false,
        zeroline: false,
        showline: false,
        autotick: true,
        tickformat: this._heatmapCaptions.timeWindow > 7 ? "%I:%M %p" : "%b %e",
        showticklabels: true,
        tickfont: this._getFontStyles(10),
      },
      title: {
        text: this._heatmapCaptions.chartTitle,
        x: 0.01,
        font: this._getFontStyles(13, this._defaultFontColor),
      },
    };
  }

  private _getChartDisplaySettings(): DisplaySettings {
    return {
      /* heatmap can be fully responsive however the min-height needed in that case is greater than the iframe portal height, hence explicit width + height have been set in _getLayoutSettings
      responsive: true,*/
      displayModeBar: false,
    };
  }

  public drawHeatmap(): void {
    // todo - create random elementId generator so multiple heatmaps can be created - ticket # 431469
    Plotly.plot(
      Heatmap.elementId,
      this._getChartSettings(),
      this._getLayoutSettings(),
      this._getChartDisplaySettings()
    );
    const plotDiv: any = document.getElementById(Heatmap.elementId);
    plotDiv.on("plotly_click", (data: any) => {
      let timeSelected: string = data.points[0].x;
      timeSelected = timeSelected.replace(" ", "T");
      timeSelected = `${timeSelected}Z`;
      let xAxisIndex = 0;
      for (let i = 0; i < this._chartData.xAxisPoints.length; i++) {
        if (this._chartData.xAxisPoints[i] === timeSelected) {
          xAxisIndex = i;
          break;
        }
      }
      const output = [];
      for (let i = 0; i < this._chartData.dataPoints.length; i++) {
        output.push(this._chartData.dataPoints[i][xAxisIndex]);
      }
      sendCachedDataMessage(MessageTypes.LogInfo, output);
    });
  }
}

export function isDarkTheme(theme: PortalTheme) {
  return theme === PortalTheme.dark;
}

export function handleMessage(event: MessageEvent) {
  if (isInvalidParentFrameOrigin(event)) {
    return;
  }

  if (typeof event.data !== "object" || event.data["signature"] !== "pcIframe") {
    return;
  }
  if (
    typeof event.data.data !== "object" ||
    !("chartData" in event.data.data) ||
    !("chartSettings" in event.data.data)
  ) {
    return;
  }
  Plotly.purge(Heatmap.elementId);

  document.getElementById(Heatmap.elementId)!.innerHTML = "";
  const data = event.data.data;
  const chartData: DataPayload = data.chartData;
  const chartSettings: HeatmapCaptions = data.chartSettings;
  const chartTheme: PortalTheme = data.theme;
  if (Object.keys(chartData).length) {
    new Heatmap(chartData, chartSettings, chartTheme).drawHeatmap();
  } else {
    const chartTitleElement = document.createElement("div");
    chartTitleElement.innerHTML = data.chartSettings.chartTitle;
    chartTitleElement.classList.add("chartTitle");

    const noDataMessageElement = document.createElement("div");
    noDataMessageElement.classList.add("noDataMessage");
    const noDataMessageContent = document.createElement("div");
    noDataMessageContent.innerHTML = data.errorMessage;

    noDataMessageElement.appendChild(noDataMessageContent);

    if (isDarkTheme(chartTheme)) {
      chartTitleElement.classList.add("dark-theme");
      noDataMessageElement.classList.add("dark-theme");
      noDataMessageContent.classList.add("dark-theme");
    }

    document.getElementById(Heatmap.elementId)!.appendChild(chartTitleElement);
    document.getElementById(Heatmap.elementId)!.appendChild(noDataMessageElement);
  }
}

window.addEventListener("message", handleMessage, false);
sendReadyMessage();
