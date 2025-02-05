/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { BoardFilterProps } from "@/components/board/board-filter-dialog";
import { useState } from "react";
import ReactGridLayout from "react-grid-layout";

interface DashboardProps {
  layout: ReactGridLayout.Layout[];
  data: {
    filters: BoardFilterProps[];
  };
}

export default function StorybookBoardPage() {
  const [value, setValue] = useState<DashboardProps>({
    layout: [
      { x: 0, y: 0, w: 1, h: 1, i: "0" },
      { x: 1, y: 0, w: 1, h: 1, i: "1" },
      { x: 2, y: 0, w: 1, h: 1, i: "2" },
      { x: 3, y: 0, w: 1, h: 1, i: "3" },
    ],
    data: { filters: [] },
  });

  // console.log(value);

  return (
    <div className="relative h-full w-full flex-1">
      {/* <Board value={value} setValue={setValue} /> */}
    </div>
  );
}
