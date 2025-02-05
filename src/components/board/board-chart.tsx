import { useEffect, useRef, useState } from "react";
import Chart from "../chart";
import { ChartValue } from "../chart/chartTypes";
import { useBoardContext } from "./board-provider";

export default function BoardChart({ value }: { value: ChartValue }) {
  const [data, setData] = useState<Record<string, unknown>[] | null>(null);
  const [lastLoading, setLastLoading] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { sources } = useBoardContext();

  const sql = value.params.layers[0].sql;
  const sourceId = value.source_id;

  useEffect(() => {
    if (!sources || !sourceId || !sql) {
      return;
    }

    setLastLoading(Date.now());

    sources
      .query(sourceId, sql)
      .then((v) => {
        setData(v);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => setLastLoading(0));
  }, [sources, sourceId, sql]);

  useEffect(() => {
    if (loaderRef.current && lastLoading) {
      const interval = setInterval(() => {
        if (loaderRef.current) {
          const progress = Math.min(
            ((Date.now() - lastLoading) / 3000) * 100,
            80
          );

          loaderRef.current.style.width = `${progress}%`;
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [lastLoading]);

  return (
    <>
      {!!lastLoading && (
        <div className="absolute top-0 right-0 left-0 z-10 h-[3px]">
          <div
            ref={loaderRef}
            className="h-[3px] bg-blue-400 transition-all"
          ></div>
        </div>
      )}
      {data ? (
        <Chart className="h-full w-full" value={value} data={data} />
      ) : null}
    </>
  );
}
