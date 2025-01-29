import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDatabaseDriver } from "@/context/driver-provider";
import { DatabaseResultSet, DatabaseValue } from "@/drivers/base-driver";
import { convertDatabaseValueToString } from "@/drivers/sqlite/sql-helper";
import { cn } from "@/lib/utils";
import { isLinkString } from "@/lib/validation";
import { ColumnType } from "@outerbase/sdk-transform";
import { LucideArrowUpRight, LucideLoader } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { OptimizeTableHeaderWithIndexProps } from "../table-optimized";
import DisplayLinkCell from "./display-link-cell";

interface TableCellProps<T = unknown> {
  align?: "left" | "right";
  value: T;
  valueType?: ColumnType;
  focus?: boolean;
  onFocus?: () => void;
  onDoubleClick?: () => void;
  header: OptimizeTableHeaderWithIndexProps;
}

interface SneakpeakProps {
  fkSchemaName: string;
  fkTableName: string;
  fkColumnName: string;
  value: DatabaseValue;
}

function SnippetRow({
  fkSchemaName,
  fkTableName,
  fkColumnName,
  value,
}: SneakpeakProps) {
  const { databaseDriver } = useDatabaseDriver();
  const [data, setData] = useState<DatabaseResultSet>();

  useEffect(() => {
    databaseDriver
      .findFirst(fkSchemaName, fkTableName, { [fkColumnName]: value })
      .then(setData)
      .catch(console.error);
  }, [databaseDriver, fkSchemaName, fkTableName, fkColumnName, value]);

  if (!data) {
    return (
      <div className="p-4 text-sm">
        <LucideLoader className="animate-spin" />
        <p>Loading...</p>
      </div>
    );
  }

  if (data.rows.length === 0) {
    return <div>Data not found</div>;
  }

  return (
    <div className="flex grow flex-col gap-3 p-4">
      {data.headers.map((header) => {
        const value = data.rows[0][header.name];
        let colorClassName = "";

        if (value === "" || value === null)
          colorClassName = "text-gray-400 dark:text-gray-600";
        if (typeof value === "string") colorClassName = "text-orange-500";
        if (typeof value === "bigint" || typeof value === "number")
          colorClassName = "text-blue-600 dark:text-blue-300";

        return (
          <div key={header.name}>
            <div className="mb-1 font-mono text-xs text-gray-400">
              {header.displayName}
            </div>
            <div
              className={cn(
                "line-clamp-1 block w-[350px] overflow-hidden font-mono text-sm text-ellipsis whitespace-nowrap",
                colorClassName
              )}
            >
              {convertDatabaseValueToString(value) || "EMPTY"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ForeignKeyColumnSnippet(props: SneakpeakProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover onOpenChange={setOpen}>
      <PopoverTrigger>
        <LucideArrowUpRight className="h-4 w-4 text-gray-400 hover:text-blue-600" />
      </PopoverTrigger>
      <PopoverContent
        side="right"
        className="m-0 w-[400px] overflow-hidden p-0"
      >
        <div className="flex h-full w-full flex-col overflow-hidden">
          <div className="border-b px-4 py-2">
            <strong>{props.fkTableName}</strong>
          </div>
          <div className="max-h-[300px] grow overflow-x-hidden overflow-y-auto">
            {open && <SnippetRow {...props} />}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function prettifyBytes(bytes: Uint8Array) {
  return [...bytes]
    .map((b) =>
      b === 0x5c
        ? "\\\\"
        : b >= 0x20 && b !== 0x7f
          ? String.fromCharCode(b)
          : "\\x" + b.toString(16).toUpperCase().padStart(2, "0")
    )
    .join("");
}

function BlobCellValue({
  value,
  vector,
}: {
  value: Uint8Array | ArrayBuffer | number[];
  vector?: boolean;
}) {
  if (vector) {
    const floatArray = new Float32Array(new Uint8Array(value).buffer);
    const floatArrayText = floatArray.join(", ");

    return (
      <div className="flex">
        <div className="mr-2 flex-col items-center justify-center">
          <span className="inline rounded bg-blue-500 p-1 pr-2 pl-2 text-white">
            vec({floatArray.length})
          </span>
        </div>
        <div className="text-orange-600">[{floatArrayText}]</div>
      </div>
    );
  } else {
    const bytes = new Uint8Array(value);

    return (
      <div className="flex w-full">
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-orange-600 dark:text-orange-400">
          {prettifyBytes(bytes.subarray(0, 64))}
        </span>
        <div className="ml-2 flex-col items-center justify-center">
          <span className="inline rounded bg-blue-500 p-1 pr-2 pl-2 text-white">
            {bytes.length.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            {" bytes"}
          </span>
        </div>
      </div>
    );
  }
}

export default function GenericCell({
  value,
  onFocus,
  align,
  onDoubleClick,
  header,
}: TableCellProps) {
  const className = cn("libsql-cell font-mono flex", "pl-2 pr-2");
  const isAlignRight = align === "right";

  const textBaseStyle = cn(
    "flex grow text-gray-500",
    isAlignRight ? "justify-end" : ""
  );

  const fkContent = useMemo(() => {
    if (header.metadata.referenceTo && value !== undefined) {
      return (
        <div className="ml-2 flex shrink-0 cursor-pointer items-center">
          <ForeignKeyColumnSnippet
            fkSchemaName={header.metadata.referenceTo.schema}
            fkColumnName={header.metadata.referenceTo.column}
            fkTableName={header.metadata.referenceTo.table}
            value={value}
          />
        </div>
      );
    }
    return null;
  }, [header, value]);

  const content = useMemo(() => {
    if (value === null) {
      return <span className={textBaseStyle}>NULL</span>;
    }

    if (value === undefined) {
      return (
        <span className={textBaseStyle}>
          {header.metadata.columnSchema?.constraint?.generatedExpression ??
            "DEFAULT"}
        </span>
      );
    }

    if (typeof value === "string") {
      if (isLinkString(value)) {
        return <DisplayLinkCell link={value} />;
      }

      return (
        <span
          className={cn(
            "flex-1 overflow-hidden text-ellipsis whitespace-nowrap",
            "text-green-600 dark:text-green-700"
          )}
        >
          {value}
        </span>
      );
    }

    if (typeof value === "number" || typeof value === "bigint") {
      return (
        <span
          className={cn(
            "flex-1 overflow-hidden text-ellipsis whitespace-nowrap",
            "block grow text-right text-blue-700 dark:text-blue-300"
          )}
        >
          {value.toString()}
        </span>
      );
    }

    if (
      value instanceof ArrayBuffer ||
      value instanceof Uint8Array ||
      Array.isArray(value)
    ) {
      return (
        <BlobCellValue
          value={value}
          vector={
            header.metadata.originalType?.includes("F32_BLOB") ||
            header.metadata.originalType?.includes("FLOAT32 ")
          }
        />
      );
    }

    return <span>{value.toString()}</span>;
  }, [value, textBaseStyle, header]);

  return (
    <div
      className={className}
      onMouseDown={onFocus}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex grow overflow-hidden">{content}</div>
      {fkContent}
    </div>
  );
}
