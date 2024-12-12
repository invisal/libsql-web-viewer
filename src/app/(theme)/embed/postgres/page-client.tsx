"use client";
import { Studio } from "@/components/gui/studio";
import {
  detectEmbedConnection,
  IframePostgresDriver,
} from "@/drivers/iframe-driver";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function EmbedPageClient() {
  const searchParams = useSearchParams();

  const embedConnection = useMemo(() => detectEmbedConnection(), []);
  const driver = useMemo(
    () => new IframePostgresDriver(embedConnection),
    [embedConnection]
  );

  useEffect(() => {
    return driver.listen();
  }, [driver]);

  return (
    <Studio
      driver={driver}
      name={searchParams.get("name") || "Unnamed Connection"}
      color={searchParams.get("color") || "gray"}
    />
  );
}
