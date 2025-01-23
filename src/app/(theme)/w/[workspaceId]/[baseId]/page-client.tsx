"use client";

import OpacityLoading from "@/components/gui/loading-opacity";
import { Studio } from "@/components/gui/studio";
import { getOuterbaseBase } from "@/outerbase-cloud/api";
import { OuterbaseAPISource } from "@/outerbase-cloud/api-type";
import { OuterbaseMySQLDriver } from "@/outerbase-cloud/database/mysql";
import { OuterbasePostgresDriver } from "@/outerbase-cloud/database/postgresql";
import { OuterbaseSqliteDriver } from "@/outerbase-cloud/database/sqlite";
import { useEffect, useMemo, useState } from "react";

export default function OuterbaseSourcePageClient({
  workspaceId,
  baseId,
}: {
  workspaceId: string;
  baseId: string;
}) {
  const [source, setSource] = useState<OuterbaseAPISource>();

  useEffect(() => {
    if (!workspaceId) return;
    if (!baseId) return;

    getOuterbaseBase(workspaceId, baseId).then((base) => {
      if (!base) return;
      setSource(base.sources[0]);
    });
  }, [workspaceId, baseId]);

  const outerbaseDriver = useMemo(() => {
    if (!workspaceId || !source) return null;

    const dialect = source.type;
    const outerbaseConfig = {
      workspaceId,
      sourceId: source.id,
      baseId: "",
      token: localStorage.getItem("ob-token") ?? "",
    };

    if (dialect === "postgres") {
      return new OuterbasePostgresDriver(outerbaseConfig);
    } else if (dialect === "mysql") {
      return new OuterbaseMySQLDriver(outerbaseConfig);
    }

    return new OuterbaseSqliteDriver(outerbaseConfig);
  }, [workspaceId, source]);

  if (!outerbaseDriver) {
    return <OpacityLoading />;
  }

  return (
    <Studio color="gray" driver={outerbaseDriver} name="Storybook Testing" />
  );
}
