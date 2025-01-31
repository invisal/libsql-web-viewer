import { Database } from "@phosphor-icons/react";
import { MySQLIcon, PostgreIcon, SQLiteIcon } from "../icons/outerbase-icon";
import { CloudflareIcon, StarbaseIcon, ValTownIcon } from "./icon";
import { GeneralVisual, MySQLVisual, SQLiteVisual } from "./visual";

export function getDatabaseFriendlyName(type: string) {
  if (type === "sqlite") return "SQLite";
  if (type === "mysql") return "MySQL";
  if (type === "postgres") return "PostgreSQL";
  if (type === "rqlite") return "rqlite";
  if (type === "turso") return "Turso";
  if (type === "libsql") return "LibSQL";
  if (type === "mssql") return "Microsoft SQL";
  if (type === "snowflake") return "Snowflake";
  if (type === "motherduck") return "Motherduck";
  if (type === "duckdb") return "DuckDB";
  if (type === "cloudflare") return "Cloudflare";
  if (type === "starbasedb") return "StarbaseDB";
  if (type === "bigquery") return "BigQuery";

  return type;
}

export function getDatabaseIcon(type: string) {
  if (type === "mysql") return MySQLIcon;
  if (type === "postgres") return PostgreIcon;
  if (type === "cloudflare") return CloudflareIcon;
  if (type === "valtown") return ValTownIcon;
  if (type === "starbasedb") return StarbaseIcon;
  if (type === "libsql") return SQLiteIcon;

  return Database;
}

export function getDatabaseVisual(type: string) {
  if (type === "mysql") return MySQLVisual;
  if (type === "sqlite") return SQLiteVisual;
  if (type === "postgres") return GeneralVisual;

  return GeneralVisual;
}
