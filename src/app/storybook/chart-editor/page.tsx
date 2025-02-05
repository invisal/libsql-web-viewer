"use client";
import Chart from "@/components/chart";
import { ChartData, ChartValue } from "@/components/chart/chartTypes";
import EditChartMenu from "@/components/chart/edit-chart-menu";
import { useState } from "react";

const data: ChartData[] = [
  {
    seller: 49,
    seller2: 1049,
    _year: 2019,
  },
  {
    seller: 590,
    seller2: 1590,
    _year: 2020,
  },
  {
    seller: 7908,
    seller2: 8908,
    _year: 2021,
  },
  {
    seller: 4985,
    seller2: 5985,
    _year: 2022,
  },
  {
    seller: 2638,
    seller2: 3638,
    _year: 2023,
  },
  {
    seller: 4,
    seller2: 1004,
    _year: 2024,
  },
];

const lineChartValue: ChartValue = {
  connection_id: null,
  created_at: "2025-01-31T08:44:04.868Z",
  id: "94019f17-a1e0-4db2-b89e-4457cbed3ce4",
  model: "chart",
  name: "New Chart",
  params: {
    id: "94019f17-a1e0-4db2-b89e-4457cbed3ce4",
    name: "New Chart",
    type: "line",
    model: "chart",
    apiKey: "",
    layers: [
      {
        sql: "select count(*) as seller,count(*) + 1000 as seller2, year(l192_new.supplier.registered_date) as _year\nFROM\n    supplier\nGROUP BY _year\nhaving _year is not null\nORDER BY _year\n",
        type: "line",
      },
    ],
    options: {
      text: "Hello world",
      theme: "afterburn",
      xAxisKey: "_year",
      yAxisKeys: ["seller", "seller2"],
      xAxisLabel: "cust year",
      yAxisLabel: "cust sellers",
      gradientStop: "#42788F",
      gradientStart: "#2C4F5E",
      backgroundType: "gradient",
      yAxisKeyColors: {
        seller: "#E75F98",
        seller2: "#FFA285",
      },
      xAxisLabelHidden: false,
      yAxisLabelHidden: false,
      yAxisLabelDisplay: "right",
    },
    source_id: "856a1855-2bee-4d87-9756-a783088c0568",
    created_at: "2025-01-31T08:44:04.868Z",
    updated_at: "2025-01-31T08:44:04.868Z",
    workspace_id: "3db2e96f-ee43-412d-be09-25fc02d3a463",
    connection_id: null,
  },
  source_id: "856a1855-2bee-4d87-9756-a783088c0568",
  type: "line",
  updated_at: "2025-02-02T13:44:55.532Z",
  workspace_id: "3db2e96f-ee43-412d-be09-25fc02d3a463",
};

export default function StorybookChartEditorPage() {
  const [chartValue, setChartValue] = useState(lineChartValue);
  const [items] = useState(data);
  return (
    <div className="flex h-full space-x-4">
      <div className="w-full flex-1 border-r p-4">
        <Chart value={chartValue} data={items} />
      </div>
      <div className="w-[400px] flex-shrink-0 p-4">
        {/* render chart editor menu here */}
        <EditChartMenu value={chartValue} setValue={setChartValue} />
      </div>
    </div>
  );
}
