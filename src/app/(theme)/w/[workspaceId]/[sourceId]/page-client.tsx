"use client";

import { Studio } from "@/components/gui/studio";
import { OuterbaseSqliteDriver } from "@/outerbase-cloud/database/sqlite";
import { useMemo } from "react";

export default function OuterbaseSourcePageClient({
  workspaceId,
  sourceId,
}: {
  workspaceId: string;
  sourceId: string;
}) {
  const outerbaseDriver = useMemo(() => {
    return new OuterbaseSqliteDriver({
      workspaceId,
      sourceId,
      baseId: "",
      token: localStorage.getItem("ob-token") ?? "",
    });
  }, [workspaceId, sourceId]);

  return (
    <Studio color="gray" driver={outerbaseDriver} name="Storybook Testing" />
  );
}
