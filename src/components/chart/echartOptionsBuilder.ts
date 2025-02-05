import {
  BarSeriesOption,
  EChartsOption,
  FunnelSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
  ScatterSeriesOption,
  SeriesOption,
} from "echarts";
import { ChartData, ChartValue, ThemeColors, THEMES } from "./chartTypes";

export default class EchartOptionsBuilder {
  private chartValue: ChartValue;
  private chartData: ChartData[];
  private theme: "dark" | "light" = "light";
  private columns: string[] = [];
  public chartHeight: number = 0;
  public chartWidth: number = 0;
  public colorTheme: ThemeColors = "mercury";

  constructor(value: ChartValue, data: ChartData[]) {
    this.chartValue = value;
    this.chartData = data;
  }

  setChartValue(value: ChartValue) {
    this.chartValue = value;
  }

  getChartType() {
    return this.chartValue.type;
  }

  setTheme(theme: string) {
    this.theme = theme as "dark" | "light";
  }

  private getColorValues(): string[] {
    const DEFAULT_THEME = "mercury";
    const colorTheme = this.colorTheme ?? DEFAULT_THEME;
    const values = THEMES[colorTheme];

    if (!values) {
      throw new Error(`Theme "${colorTheme}" does not exist`);
    }

    return values.colors[this.theme]; // return light or dark values
  }

  private getTextColor(): string {
    return (
      this.chartValue.params.options?.foreground ??
      (this.theme === "dark" ? "#FFFFFF" : "#000000")
    );
  }

  getChartOptions(): EChartsOption {
    const colorValues = this.getColorValues();

    const formattedSource = this.chartData;
    this.columns = [];
    if (this.chartValue.params.options?.xAxisKey) {
      this.columns.push(this.chartValue.params.options.xAxisKey);
    }
    for (const key of this.chartValue.params.options.yAxisKeys) {
      this.columns.push(key);
    }

    const isTall = this.chartHeight > 150;

    const gridLineColors = this.theme === "dark" ? "#FFFFFF08" : "#00000010";
    const axisLineColors = this.theme === "dark" ? "#FFFFFF15" : "#00000020";

    // Determine if the X axis data is a date
    const isXAxisDate = !!(
      this.columns[0] &&
      this.chartData.some((item) => isDate(item[this.columns[0]] as string))
    );
    const isYAxisDate = !!(
      this.columns[1] &&
      formattedSource.some((item) => isDate(item[this.columns[1]] as string))
    );

    if (this.chartValue.type === "radar") {
      return {
        radar: {
          shape: "polygon",
          indicator: this.columns.map((name) => ({ name })),
        },
        series: this.columns.map((col, index) => ({
          type: "radar",
          data: [
            {
              value: formattedSource.map((item) => Number(item[col])), // throws away precision of bigint?!
              name: col,
              itemStyle: {
                color:
                  this.chartValue.params.options.yAxisKeyColors?.[col] ||
                  colorValues[index % colorValues.length],
              },
            },
          ],
        })),
        tooltip: {
          trigger: "item",
          borderColor: gridLineColors, // fix issue where 'item' tooltips were a different color than the rest (maybe it matched the series color)
        },
      };
    }

    const xAxisLabel = !this.chartValue.params.options.xAxisLabel
      ? this.chartValue.params.options.xAxisKey
      : this.chartValue.params.options.xAxisLabel;

    const options: EChartsOption = {
      // backgroundColor: this.getBackgroundColor(),
      dataset: {
        dimensions: this.columns,
        source: formattedSource,
      },
      tooltip: {
        trigger: this.chartValue.type === "scatter" ? "item" : "axis",
        borderColor: gridLineColors, // fix issue where 'item' tooltips were a different color than the rest (maybe it matched the series color)
      },
      legend: {
        show: isTall,
        data: this.columns.slice(1),
        textStyle: {
          color: this.getTextColor(),
        },
        top: 8,
        orient: "horizontal",
        type: "scroll", // Enable scrolling if too many items
      },
      grid: {
        left: "0", // this.type === 'bar' ? '100' : '0',
        right: "6",
        bottom:
          this.chartValue.params.options.xAxisLabel && isTall ? "23" : "0", // isTall ? '15%' : '15%',
        top: this.chartValue.params.options.yAxisLabel && isTall ? "26" : "8",
        containLabel: true,
      },
      xAxis: {
        show: !this.chartValue.params.options.xAxisLabelHidden,
        type:
          this.chartValue.type === "bar"
            ? "value"
            : isXAxisDate
              ? "time"
              : "category",
        name: isTall ? xAxisLabel : "",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: this.getTextColor(),
        },
        axisLine: {
          show: false,
          lineStyle: {
            color: axisLineColors,
          },
        },
        axisLabel: {
          // @ts-ignore bug in echarts? this definitely exists
          formatter: isXAxisDate ? undefined : this.labelFormatter,
          color: this.getTextColor(),
          hideOverlap: true,
          rotate:
            this.chartValue.params.options.xAxisLabelDisplay === "auto"
              ? -45
              : 0,
          align: "center",
        },
        splitLine: {
          show: false,
          lineStyle: {
            color: gridLineColors,
          },
        },
      },
      yAxis: {
        type:
          this.chartValue.type === "bar"
            ? isXAxisDate
              ? "time"
              : "category"
            : isYAxisDate
              ? "time"
              : "value",
        name: isTall ? this.chartValue.params.options.yAxisLabel : "",
        show: this.chartValue.params.options.yAxisLabelDisplay !== "hidden",
        position:
          (this.chartValue.params.options.yAxisLabelDisplay !== "hidden" &&
            this.chartValue.params.options.yAxisLabelDisplay) ||
          undefined, // exclude `hidden`, pass left/right
        nameTextStyle: {
          color: this.getTextColor(),
          align: "left",
          padding: [0, 0, 0, 0],
        },
        axisLine: {
          show: false,
          lineStyle: {
            color: axisLineColors,
          },
        },
        axisLabel: {
          // @ts-ignore bug in echarts? this definitely exists
          formatter: isXAxisDate ? undefined : this.labelFormatter, // `isXAxisDate` is not a typo
          color: this.getTextColor(),
          align: "right",
          inside: false,
        },
        axisTick: {
          inside: false,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: gridLineColors,
          },
        },
      },
    };

    return this.addSeries(options); // Pass the source dataset when adding series
  }

  private addSeries(_options: EChartsOption) {
    const options = { ..._options };

    switch (this.chartValue.type) {
      case "column":
        options.series = this.constructSeries<BarSeriesOption>("bar", {
          animationDelay: (idx) => idx * 0.8,
        });
        break;
      case "line":
        options.series = this.constructSeries<LineSeriesOption>("line", {
          showSymbol: false,
          animationDuration: 1000,
          animationEasing: "cubicOut",
        });
        break;
      case "scatter":
        options.series = this.constructSeries<ScatterSeriesOption>("scatter", {
          symbolSize: 8,
          itemStyle: {
            borderWidth: 2,
            borderColor: this.getTextColor(),
            color: "transparent", // Make the fill transparent
          },
        });
        break;
      case "area":
        options.series = this.constructSeries<LineSeriesOption>("line", {
          areaStyle: {},
          smooth: true,
        });
        break;
      case "bar":
        options.series = this.constructSeries<BarSeriesOption>("bar", {
          animationDelay: (idx) => idx * 0.8,
          barWidth: "40%",
          coordinateSystem: "cartesian2d",
        });
        options.xAxis = {
          ...options.xAxis,

          // Add split line style here for x-axis
          splitLine: {
            ...(options.xAxis as any).splitLine,
            show: true,
          },
        };
        break;
      case "funnel":
        options.series = this.constructSeries<FunnelSeriesOption>("funnel", {
          left: "10%",
          top: 26,
          bottom: 0,
          width: "80%",
          minSize: "0%",
          maxSize: "100%",
          sort: "descending",
          label: {
            show: true,
            position: "inside",
            formatter: "{b}: {c}",
            color: "#fff", // label color
          },
          gap: 2,
          itemStyle: {
            borderColor: "rgba(0, 0, 0, 0.2)",
            borderWidth: 1,
          },
          data: this.chartData?.map((item) => ({
            name: item[this.columns[0]] as string,
            value: item[this.columns[1]] as number,
          })),
          color: this.getColorValues(),
        });
        break;
      case "pie":
        options.series = this.constructSeries<PieSeriesOption>("pie", {
          data:
            this.chartData?.map((item) => ({
              name: item[this.columns[0]] as string,
              value: item[this.columns[1]] as number,
            })) ?? [],
          radius: ["40%", "70%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: "rgba(0, 0, 0, 0.2)",
            borderWidth: 2,
          },
          label: {
            show: this.chartValue.params?.options?.xAxisLabelHidden !== true,
            formatter: "{b}: {c} ({d}%)",
            color: this.theme === "dark" ? "#fff" : "#000", // Set label text color to white
            textBorderColor: "transparent", // Remove text border
          },
          color: this.getColorValues(),
          tooltip: {
            trigger: "item",
            borderColor: this.theme === "dark" ? "#FFFFFF08" : "#00000010", // fix issue where 'item' tooltips were a different color than the rest (maybe it matched the series color)
          },
        });

        break;
      default:
        break;
    }

    return options;
  }

  private constructSeries<T extends SeriesOption>(
    seriesType: T["type"],
    additionalOptions: Partial<Omit<T, "type">> = {}
  ): T[] {
    return this.columns.slice(1).map((col) => {
      const baseSeries = {
        name: col,
        type: seriesType,
        encode:
          this.chartValue.type === "bar"
            ? { x: col, y: this.columns[0] } // For bar charts
            : { x: this.columns[0], y: col }, // For other chart types
        itemStyle: {
          color: this.chartValue.params.options.yAxisKeyColors?.[col], // does NOT impact pie charts
        },
        symbol: "circle",
        ...additionalOptions,
      };

      if (this.isValidSeriesOption<T>(baseSeries)) {
        return baseSeries as unknown as T;
      } else {
        throw new Error(
          `The series option is invalid for series type "${seriesType}".`
        );
      }
    });
  }
  private isValidSeriesOption<T extends SeriesOption>(
    series: any
  ): series is T {
    return (
      series &&
      typeof series === "object" &&
      typeof series.name === "string" &&
      typeof series.type === "string"
    );
  }
}

function isDate(dateString: string): boolean {
  if (!isNaN(Number(dateString))) {
    // this is number
    return false;
  } else {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}
