import { BoardSourceDriver } from "@/drivers/board-source/base-source";
import { useState } from "react";
import { ChartValue } from "../chart/chartTypes";
import { BoardCanvas } from "./board-canvas";
import { BoardFilter } from "./board-filter";
import { BoardFilterProps } from "./board-filter-dialog";
import { BoardProvider } from "./board-provider";

export interface DashboardProps {
  charts: ChartValue[];
  layout: ReactGridLayout.Layout[];
  name: string;
  data: {
    filters: BoardFilterProps[];
  };
}

interface Props {
  value: DashboardProps;
  sources?: BoardSourceDriver;
  setValue: (value: DashboardProps) => void;
  interval: number;
  setInterval: (v: number) => void;
  onRefresh?: () => void;
}

export default function Board({
  value,
  setValue,
  sources,
  interval,
  setInterval,
  onRefresh,
}: Props) {
  const [editMode, setEditMode] = useState<
    "ADD_CHART" | "REARRANGING_CHART" | null
  >(null);

  return (
    <BoardProvider sources={sources}>
      <div>
        <BoardFilter
          filters={value.data.filters}
          onFilters={(v) =>
            setValue({
              ...value,
              data: {
                ...value.data,
                filters: v,
              },
            })
          }
          editMode={editMode}
          setEditMode={setEditMode}
          name={value.name}
          interval={interval}
          setInterval={setInterval}
          onRefresh={onRefresh}
        />
        <BoardCanvas
          value={value}
          onChange={(v) => {
            setValue({
              ...value,
              layout: v,
            });
          }}
          editMode={editMode}
          setEditMode={setEditMode}
        />
      </div>
    </BoardProvider>
  );
}
