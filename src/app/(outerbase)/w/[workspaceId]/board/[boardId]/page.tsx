"use client";

import { useWorkspaces } from "@/app/(outerbase)/workspace-provider";
import Board from "@/components/board";
import ClientOnly from "@/components/client-only";
import { getOuterbaseDashboard } from "@/outerbase-cloud/api";
import { OuterbaseAPIDashboardDetail } from "@/outerbase-cloud/api-type";
import OuterbaseBoardSourceDriver from "@/outerbase-cloud/database-source";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import useSWR from "swr";

function BoardPageEditor({
  initialValue,
  interval,
  setInterval,
  onRefresh,
}: {
  initialValue: OuterbaseAPIDashboardDetail;
  interval: number;
  setInterval: (v: number) => void;
  onRefresh?: () => void;
}) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces } = useWorkspaces();

  const boardSources = useMemo(() => {
    if (workspaces.length === 0) return;

    return new OuterbaseBoardSourceDriver(
      workspaces.find(
        (w) => w.id === workspaceId || w.short_name === workspaceId
      )!
    );
  }, [workspaces, workspaceId]);

  const [value, setValue] = useState(initialValue);

  if (!boardSources) {
    return <div>Loading Workspace....</div>;
  }

  return (
    <Board
      value={value as any}
      setValue={setValue as any}
      sources={boardSources}
      interval={interval}
      setInterval={setInterval}
      onRefresh={onRefresh}
    />
  );
}

export default function BoardPage() {
  const [interval, setInterval] = useState(0);
  const { workspaceId, boardId } = useParams<{
    boardId: string;
    workspaceId: string;
  }>();
  const { data, mutate } = useSWR(
    `board-${boardId}`,
    () => {
      return getOuterbaseDashboard(workspaceId, boardId);
    },
    interval <= 0
      ? {}
      : {
          refreshInterval: interval,
        }
  );

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-y-autp h-screen w-screen overflow-x-hidden">
      <ClientOnly>
        <BoardPageEditor
          initialValue={data}
          interval={interval}
          setInterval={setInterval}
          onRefresh={mutate}
        />
      </ClientOnly>
    </div>
  );
}
