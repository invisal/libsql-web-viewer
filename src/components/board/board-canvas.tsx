"use client";
import { cn } from "@/lib/utils";
import {
  EditIcon,
  EllipsisVertical,
  HandHelping,
  ImageUpscale,
  RectangleHorizontal,
  RefreshCcw,
  Square,
  Trash2,
} from "lucide-react";
import { useCallback } from "react";
import RGL, { WidthProvider } from "react-grid-layout";
import { DashboardProps } from ".";
import { buttonVariants } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import BoardChart from "./board-chart";
import "./board-style.css";

export interface BoardChartLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  i: number;
}

interface BoardProps {
  value: DashboardProps;
  onChange: (v: ReactGridLayout.Layout[]) => void;
  editMode?: "ADD_CHART" | "REARRANGING_CHART" | null;
  setEditMode?: (mode: "ADD_CHART" | "REARRANGING_CHART" | null) => void;
}

const ReactGridLayout = WidthProvider(RGL);

export function BoardCanvas({
  value,
  onChange,
  editMode,
  setEditMode,
}: BoardProps) {
  const sizes = [
    { w: 1, h: 1, name: "1", icon: <Square className="h-3 w-3" /> },
    {
      w: 2,
      h: 1,
      name: "2",
      icon: <RectangleHorizontal className="h-4 w-4" />,
    },
    { w: 2, h: 2, name: "3", icon: <Square className="h-4 w-4" /> },
    {
      w: 4,
      h: 2,
      name: "4",
      icon: <RectangleHorizontal className="h-4 w-4" />,
    },
  ];

  const menus = [
    {
      name: "Edit chart",
      icon: <EditIcon className="h-4 w-4" />,
      onclick: () => {},
    },
    {
      name: "Refresh data",
      icon: <RefreshCcw className="h-4 w-4" />,
      onclick: () => {},
    },
    {
      name: "Rearrange layout",
      icon: <ImageUpscale className="h-4 w-4" />,
      onclick: () => {
        setEditMode && setEditMode("REARRANGING_CHART");
      },
    },
    {
      name: "Embed chart",
      icon: <HandHelping className="h-4 w-4" />,
      onclick: () => {},
    },
    {
      name: "Delete chart",
      icon: <Trash2 className="h-4 w-4" />,
      onclick: () => {},
    },
  ];

  const handleClickResize = useCallback(
    (w: number, h: number, index: number) => {
      const dummy = structuredClone(value.layout);
      dummy[index].w = w;
      dummy[index].h = h;
      onChange(dummy);
    },
    [onChange, value.layout]
  );

  const mapItem: JSX.Element[] = value.layout.map((_, i) => {
    return (
      <div
        key={_.i}
        className="group dark:bg-secondary relative flex items-center justify-center overflow-hidden rounded-md bg-white shadow hover:bg-gray-50 dark:text-white"
        data-grid={_}
      >
        <BoardChart
          value={value.charts.find((chart) => chart.id === _.i) as any}
        />
        {editMode === "REARRANGING_CHART" ? (
          <div className="absolute top-4 right-4 z-40 hidden gap-2 group-hover:flex">
            {sizes.map((x, index) => {
              return (
                <button
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "icon" }),
                    "cancelSelectorName h-6 w-6 p-0"
                  )}
                  onClick={() =>
                    handleClickResize(x.w as number, x.h as number, i)
                  }
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  key={index}
                >
                  {x.icon}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="absolute top-4 right-4">
            <DropdownMenu key={_.i}>
              <DropdownMenuTrigger asChild>
                <EllipsisVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {menus.map((menu) => {
                  return (
                    <DropdownMenuItem
                      key={menu.name}
                      className="flex gap-2"
                      onClick={menu.onclick}
                    >
                      {menu.icon}
                      {menu.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  });

  return (
    <div>
      <ReactGridLayout
        cols={4}
        rowHeight={220}
        draggableCancel=".cancelSelectorName"
        className="layout overflow-x-hidden"
        layout={value.layout}
        onLayoutChange={onChange}
        isDraggable={editMode === "REARRANGING_CHART"}
        isResizable={editMode === "REARRANGING_CHART"}
        compactType={"vertical"}
      >
        {mapItem}
      </ReactGridLayout>
    </div>
  );
}
