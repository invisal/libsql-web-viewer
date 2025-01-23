import { LucideDatabase } from "lucide-react";
import { DRIVER_DETAIL, SupportedDriver } from "./saved-connection-storage";
import Link from "next/link";

interface ConnectionListItemProps {
  name: string;
  type: string;
  lastUsed: string;
  href: string;
}

export default function ConnectionListItem({
  name,
  type,
  href,
}: ConnectionListItemProps) {
  const DatabaseIcon =
    DRIVER_DETAIL[(type ?? "turso") as SupportedDriver]?.icon ?? LucideDatabase;

  return (
    <Link
      className="flex w-[300px] overflow-hidden rounded-lg border bg-background hover:bg-zinc-50 dark:hover:bg-zinc-900"
      href={href}
    >
      <div className="ml-3 mr-2 flex flex-1 shrink-0 flex-col gap-3 py-4">
        <div className="flex gap-2 overflow-hidden">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-accent">
            <DatabaseIcon className="h-6 w-6 text-accent-foreground" />
          </div>

          <div className="flex-1">
            <div className="w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-primary">
              {name}
            </div>
            <div className="text-xs text-muted-foreground">{type}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
