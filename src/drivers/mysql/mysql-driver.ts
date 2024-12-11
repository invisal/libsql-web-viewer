import {
  DatabaseSchemas,
  DatabaseTableSchema,
  DatabaseTriggerSchema,
  DriverFlags,
  DatabaseSchemaItem,
  DatabaseTableColumn,
  TableColumnDataType,
  DatabaseTableSchemaChange,
  ColumnTypeSelector,
} from "../base-driver";
import CommonSQLImplement from "../common-sql-imp";
import { escapeSqlValue } from "../sqlite/sql-helper";
import { generateMySqlSchemaChange } from "./generate-schema";

interface MySqlDatabase {
  SCHEMA_NAME: string;
}

interface MySqlColumn {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  COLUMN_NAME: string;
  EXTRA: string;
  COLUMN_KEY: string;
  DATA_TYPE: string;
  IS_NULLABLE: "YES" | "NO";
  COLUMN_COMMENT: string;
  CHARACTER_MAXIMUM_LENGTH: number;
  NUMERIC_PRECISION: number;
  NUMERIC_SCALE: number;
  COLUMN_DEFAULT: string;
  COLUMN_TYPE: string;
}

interface MySqlTable {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  TABLE_TYPE: string;
}

export default abstract class MySQLLikeDriver extends CommonSQLImplement {
  columnTypeSelector: ColumnTypeSelector = {
    type: "text",
    typeSuggestions: [
      {
        name: "String",
        suggestions: [
          { name: "char", description: "Fixed-length string" },
          {
            name: "varchar",
            parameters: [{ name: "length", default: "255" }],
            description: "Variable-length string",
          },
          { name: "text", description: "Variable-length string" },
        ],
      },
      {
        name: "Number",
        suggestions: [
          { name: "tinyint", description: "1 byte integer" },
          { name: "smallint", description: "2 byte integer" },
          { name: "mediumint", description: "3 byte integer" },
          { name: "int", description: "4 byte integer" },
          { name: "bigint", description: "8 byte integer" },
          { name: "float", description: "4 byte float" },
          { name: "double", description: "8 byte float" },
          {
            name: "decimal",
            parameters: [
              {
                name: "precision",
                description: "Total number of digits",
                default: "10",
              },
              {
                name: "scale",
                description: "Number of digits after the decimal point",
                default: "2",
              },
            ],
            description: (_: string, parameters?: string[]) => {
              const precision = Number(parameters?.[0]);
              const scale = Number(parameters?.[1] ?? 0);

              if (
                Number.isFinite(precision) &&
                Number.isFinite(scale) &&
                Number.isInteger(precision) &&
                Number.isInteger(scale) &&
                precision > 0 &&
                precision < 20
              ) {
                const exampleNumber = "12345678901234567890".substring(
                  0,
                  precision
                );
                const exampleBeforeDot = exampleNumber.substring(
                  0,
                  precision - scale
                );
                const exampleAfterDot = exampleNumber.substring(
                  precision - scale
                );

                return `<div>
                <div class="mb-2">Fixed-point number</div>
                <div class='inline-block'>
                  <div class="text-xs">Precision</div>
                  <div class="inline-block border-t-4 border-t-primary font-mono text-lg">
                    <span>${exampleBeforeDot}</span><strong>.</strong><span class="inline-block border-b-4 border-b-primary">${exampleAfterDot}</span>
                  </div>
                  <div class="text-xs text-right">Scale</div>
                </div>
              </div>`;
              }

              return `<div>Fixed-point number</div>`;
            },
          },
        ],
      },
    ],
  };

  escapeId(id: string) {
    return `\`${id.replace(/`/g, "``")}\``;
  }

  escapeValue(value: unknown): string {
    return escapeSqlValue(value);
  }

  getFlags(): DriverFlags {
    return {
      defaultSchema: "",
      optionalSchema: false,
      supportBigInt: false,
      supportModifyColumn: true,
      mismatchDetection: false,
      supportCreateUpdateTable: true,
      dialect: "mysql",

      supportUseStatement: true,
      supportRowId: false,
      supportInsertReturning: false,
      supportUpdateReturning: false,
    };
  }

  async getCurrentSchema(): Promise<string | null> {
    const result = (await this.query("SELECT DATABASE() AS db")) as unknown as {
      rows: { db?: string | null }[];
    };

    return result.rows[0].db!;
  }

  async schemas(): Promise<DatabaseSchemas> {
    const schemaSql =
      "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')";
    const schemaResult = (await this.query(schemaSql))
      .rows as unknown as MySqlDatabase[];

    const tableSql =
      "SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE FROM information_schema.tables WHERE TABLE_SCHEMA NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')";
    const tableResult = (await this.query(tableSql))
      .rows as unknown as MySqlTable[];

    const columnSql =
      "SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, DATA_TYPE, EXTRA FROM information_schema.columns WHERE TABLE_SCHEMA NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')";
    const columnResult = (await this.query(columnSql))
      .rows as unknown as MySqlColumn[];

    // Hash table of schema
    const schemaRecord: Record<string, DatabaseSchemaItem[]> = {};
    for (const s of schemaResult) {
      schemaRecord[s.SCHEMA_NAME] = [];
    }

    // Hash table of table
    const tableRecord: Record<string, DatabaseSchemaItem> = {};
    for (const t of tableResult) {
      const key = t.TABLE_SCHEMA + "." + t.TABLE_NAME;
      const table: DatabaseSchemaItem = {
        name: t.TABLE_NAME,
        type: t.TABLE_TYPE === "VIEW" ? "view" : "table",
        tableName: t.TABLE_NAME,
        schemaName: t.TABLE_SCHEMA,
        tableSchema: {
          autoIncrement: false,
          pk: [],
          columns: [],
          tableName: t.TABLE_NAME,
          schemaName: t.TABLE_SCHEMA,
        },
      };

      tableRecord[key] = table;
      if (schemaRecord[t.TABLE_SCHEMA]) {
        schemaRecord[t.TABLE_SCHEMA].push(table);
      }
    }

    for (const c of columnResult) {
      const column: DatabaseTableColumn = {
        name: c.COLUMN_NAME,
        type: c.COLUMN_TYPE,
        constraint: undefined,
      };

      const tableKey = c.TABLE_SCHEMA + "." + c.TABLE_NAME;
      const tableSchema = tableRecord[tableKey].tableSchema;
      if (tableSchema) {
        tableSchema.columns.push(column);
      }
    }

    return schemaRecord;
  }

  async tableSchema(
    schemaName: string,
    tableName: string
  ): Promise<DatabaseTableSchema> {
    const columnSql = `SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, DATA_TYPE, EXTRA, COLUMN_KEY FROM information_schema.columns WHERE TABLE_NAME=${escapeSqlValue(tableName)} AND TABLE_SCHEMA=${escapeSqlValue(schemaName)} ORDER BY ORDINAL_POSITION`;
    const columnResult = (await this.query(columnSql))
      .rows as unknown as MySqlColumn[];

    const pk = columnResult
      .filter((c) => c.COLUMN_KEY === "PRI")
      .map((c) => c.COLUMN_NAME);

    const autoIncrement = columnResult.some(
      (c) => c.EXTRA === "auto_increment"
    );

    return {
      autoIncrement,
      pk,
      tableName,
      schemaName,
      columns: columnResult.map((c) => ({
        name: c.COLUMN_NAME,
        type: c.COLUMN_TYPE,
        constraint: undefined,
      })),
    };
  }

  trigger(): Promise<DatabaseTriggerSchema> {
    throw new Error("Not implemented");
  }

  createUpdateTableSchema(change: DatabaseTableSchemaChange): string[] {
    return generateMySqlSchemaChange(this, change);
  }

  inferTypeFromHeader(): TableColumnDataType | undefined {
    return undefined;
  }
}
