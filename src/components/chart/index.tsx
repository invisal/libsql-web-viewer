"use client";
import * as echarts from "echarts";
import { EChartsOption } from "echarts";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { ChartData, ChartValue } from "./chartTypes";
import EchartOptionsBuilder from "./echartOptionsBuilder";

interface OuterbaseChartProps {
  data: ChartData[];
  value: ChartValue;
  modifier?: EChartsOption;
  className?: string;
}

const TextComponent = ({ value }: OuterbaseChartProps) => {
  let markdown = value.params.options?.text ?? "";

  // Bold (**text** or __text__)
  markdown = markdown.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  markdown = markdown.replace(/__(.*?)__/g, "<b>$1</b>");

  // Italic (*text* or _text_)
  markdown = markdown.replace(/\*(.*?)\*/g, "<i>$1</i>");
  markdown = markdown.replace(/_(.*?)_/g, "<i>$1</i>");

  // Underline (__text__)
  markdown = markdown.replace(/~~(.*?)~~/g, "<u>$1</u>");

  // Line break (double space followed by a newline)
  markdown = markdown.replace(/ {2}\n/g, "<br>");
  return (
    <div className="h-full w-full">
      <p
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          fontFamily: "Inter, sans-serif",
        }}
        className="flex-1 self-start text-neutral-900 dark:text-neutral-100"
      >
        <span
          dangerouslySetInnerHTML={{
            __html: markdown,
          }}
        ></span>
      </p>
    </div>
  );
};

const SingleValueComponent = ({ value, data }: OuterbaseChartProps) => {
  const firstRecord = data.length > 0 ? data[0] : null;
  let firstRecordValue = firstRecord
    ? firstRecord[value.params.options.xAxisKey ?? ""]
    : "";
  const formattedValue = value.params.options?.format;

  if (formattedValue === "percent") {
    const number = parseFloat(`${firstRecordValue}`);
    firstRecordValue = `${number.toFixed(2)}%`;
  } else if (formattedValue === "number") {
    const number = parseFloat(`${firstRecordValue}`);
    const rounded = Math.round(number);
    firstRecordValue = `${rounded.toLocaleString("en-US")}`;
  } else if (formattedValue === "decimal") {
    const number = parseFloat(`${firstRecordValue}`);
    firstRecordValue = `${number.toFixed(2)}`;
  } else if (formattedValue === "date") {
    const stringDate = `${firstRecordValue}`;

    // Convert to a Date object to validate the input
    const date = new Date(stringDate);

    if (!isNaN(date.getTime())) {
      // Check if the date is valid
      // Extract the date components
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are 0-based
      const day = String(date.getUTCDate()).padStart(2, "0");

      // Manually construct the formatted date string
      const formattedDate = `${month}/${day}/${year}`;

      firstRecordValue = formattedDate;
    }
  } else if (formattedValue === "time") {
    const date = new Date(`${firstRecordValue}`);
    firstRecordValue = date.toLocaleTimeString("en-US");
  } else if (formattedValue === "dollar") {
    const number = parseFloat(`${firstRecordValue}`);
    firstRecordValue = `$${number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (formattedValue === "euro") {
    const number = parseFloat(`${firstRecordValue}`);
    firstRecordValue = `€${number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (formattedValue === "pound") {
    const number = parseFloat(`${firstRecordValue}`);
    firstRecordValue = `£${number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (formattedValue === "yen") {
    const number = parseFloat(`${firstRecordValue}`);
    firstRecordValue = `¥${number.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  // there is something to check with the sizeX and sizeY
  // we will figure it out later
  const sizeX = 1;
  const sizeY = 1;

  const style: React.CSSProperties = {
    fontSize: sizeX === 1 && sizeY === 1 ? "30px" : "60px",
    lineHeight: sizeX === 1 && sizeY === 1 ? "36px" : "68px",
  };
  const fgColor = value.params.options?.foreground;
  if (fgColor) style.color = fgColor;

  return (
    <div className="h-full w-full">
      <div style={style} className="truncate font-bold">
        {firstRecordValue}
      </div>
    </div>
  );
};

const TableComponent = ({ data }: OuterbaseChartProps) => {
  return (
    <div className="w-full overflow-auto rounded border">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0">
          <tr className="bg-secondary h-[35px] text-xs">
            {Object.keys(data[0]).map((key) => (
              <th key={key} className="border-r px-2 text-left">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {Object.keys(row).map((key) => (
                <td className="border-t border-r px-4 py-2" key={key}>
                  {row[key] || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ChartComponent = ({ value, data }: OuterbaseChartProps) => {
  const domRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chartBuilderRef = useRef<EchartOptionsBuilder | null>(null);
  const { resolvedTheme, forcedTheme } = useTheme();

  useEffect(() => {
    if (
      !chartBuilderRef.current ||
      chartBuilderRef.current.getChartType() !== value.type
    ) {
      chartBuilderRef.current = new EchartOptionsBuilder(value, data);
    } else {
      chartBuilderRef.current.setChartValue(value);
    }

    if (domRef.current) {
      const currentDomRef = domRef.current;
      const chartInstance =
        echarts.getInstanceByDom(currentDomRef) || echarts.init(currentDomRef);
      chartInstance.clear();

      const chartBuilder = chartBuilderRef.current;
      chartBuilder.setTheme((forcedTheme ?? resolvedTheme) as "light" | "dark");

      // handle resize event
      const resizeObserver = new ResizeObserver((entries) => {
        requestAnimationFrame(() => {
          for (const entry of entries) {
            if (entry.target === currentDomRef) {
              const { width, height } = entry.contentRect;
              chartBuilder.chartHeight = height;
              chartBuilder.chartWidth = width;
              chartInstance.resize();
              if (timerRef.current) {
                clearTimeout(timerRef.current);
              }

              timerRef.current = setTimeout(() => {
                chartInstance.setOption(chartBuilder.getChartOptions());
              }, 200);

              break;
            }
          }
        });
      });

      resizeObserver.observe(currentDomRef);

      return () => {
        if (currentDomRef) {
          resizeObserver.unobserve(currentDomRef);
        }
      };
    }
  }, [domRef, value, data, forcedTheme, resolvedTheme]);

  return <div ref={domRef} className="h-full w-full"></div>;
};

export default function Chart({ value, data, modifier }: OuterbaseChartProps) {
  if (value.type === "text") {
    return <TextComponent value={value} data={data} />;
  } else if (value.type === "single_value") {
    return <SingleValueComponent value={value} data={data} />;
  } else if (value.type === "table") {
    return <TableComponent value={value} data={data} />;
  } else {
    return <ChartComponent value={value} data={data} modifier={modifier} />;
  }
}
