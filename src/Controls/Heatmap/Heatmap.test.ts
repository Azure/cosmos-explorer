import dayjs from "dayjs";
import { handleMessage, Heatmap, isDarkTheme } from "./Heatmap";
import { PortalTheme } from "./HeatmapDatatypes";

describe("The Heatmap Control", () => {
  const dataPoints = {
    "1": {
      "2019-06-19T00:59:10Z": {
        "Normalized Throughput": 0.35,
      },
      "2019-06-19T00:48:10Z": {
        "Normalized Throughput": 0.25,
      },
    },
  };

  const chartCaptions = {
    chartTitle: "chart title",
    yAxisTitle: "YAxisTitle",
    tooltipText: "Tooltip text",
    timeWindow: 123456789,
  };

  let heatmap: Heatmap;
  const theme: PortalTheme = 1;
  const divElement = `<div id="${Heatmap.elementId}"></div>`;

  describe("drawHeatmap rendering", () => {
    beforeEach(() => {
      heatmap = new Heatmap(dataPoints, chartCaptions, theme);
      document.body.innerHTML = divElement;
    });

    afterEach(() => {
      document.body.innerHTML = ``;
    });

    it("should call _getChartSettings when drawHeatmap is invoked", () => {
      const _getChartSettings = spyOn<any>(heatmap, "_getChartSettings");
      heatmap.drawHeatmap();
      expect(_getChartSettings.calls.any()).toBe(true);
    });

    it("should call _getLayoutSettings when drawHeatmap is invoked", () => {
      const _getLayoutSettings = spyOn<any>(heatmap, "_getLayoutSettings");
      heatmap.drawHeatmap();
      expect(_getLayoutSettings.calls.any()).toBe(true);
    });

    it("should call _getChartDisplaySettings when drawHeatmap is invoked", () => {
      const _getChartDisplaySettings = spyOn<any>(heatmap, "_getChartDisplaySettings");
      heatmap.drawHeatmap();
      expect(_getChartDisplaySettings.calls.any()).toBe(true);
    });

    it("drawHeatmap should render a Heatmap inside the div element", () => {
      heatmap.drawHeatmap();
      expect(document.body.innerHTML).not.toEqual(divElement);
    });
  });

  describe("generateMatrixFromMap", () => {
    it("should massage input data to match output expected", () => {
      expect(heatmap.generateMatrixFromMap(dataPoints).yAxisPoints).toEqual(["1"]);
      expect(heatmap.generateMatrixFromMap(dataPoints).dataPoints).toEqual([[0.25, 0.35]]);
      expect(heatmap.generateMatrixFromMap(dataPoints).xAxisPoints.length).toEqual(2);
    });

    it("should output the date format to ISO8601 string format", () => {
      expect(heatmap.generateMatrixFromMap(dataPoints).xAxisPoints[0].slice(10, 11)).toEqual("T");
      expect(heatmap.generateMatrixFromMap(dataPoints).xAxisPoints[0].slice(-1)).toEqual("Z");
    });

    it("should convert the time to the user's local time", () => {
      if (dayjs().utcOffset()) {
        expect(heatmap.generateMatrixFromMap(dataPoints).xAxisPoints).not.toEqual([
          "2019-06-19T00:48:10Z",
          "2019-06-19T00:59:10Z",
        ]);
      } else {
        expect(heatmap.generateMatrixFromMap(dataPoints).xAxisPoints).toEqual([
          "2019-06-19T00:48:10Z",
          "2019-06-19T00:59:10Z",
        ]);
      }
    });
  });

  describe("isDarkTheme", () => {
    it("isDarkTheme should return the correct result", () => {
      expect(isDarkTheme(PortalTheme.dark)).toEqual(true);
      expect(isDarkTheme(PortalTheme.azure)).not.toEqual(true);
    });
  });
});

describe("iframe rendering when there is no data", () => {
  afterEach(() => {
    document.body.innerHTML = ``;
  });

  it("should show a no data message with a dark theme", () => {
    const data = {
      data: {
        signature: "pcIframe",
        data: {
          chartData: {},
          chartSettings: {},
          theme: 4,
        },
      },
      origin: "http://localhost",
    };

    const divElement = `<div id="${Heatmap.elementId}"></div>`;
    document.body.innerHTML = divElement;

    handleMessage(data as MessageEvent);
    expect(document.body.innerHTML).toContain("dark-theme");
    expect(document.body.innerHTML).toContain("noDataMessage");
  });

  it("should show a no data message with a white theme", () => {
    const data = {
      data: {
        signature: "pcIframe",
        data: {
          chartData: {},
          chartSettings: {},
          theme: 2,
        },
      },
      origin: "http://localhost",
    };

    const divElement = `<div id="${Heatmap.elementId}"></div>`;
    document.body.innerHTML = divElement;

    handleMessage(data as MessageEvent);
    expect(document.body.innerHTML).not.toContain("dark-theme");
    expect(document.body.innerHTML).toContain("noDataMessage");
  });
});
