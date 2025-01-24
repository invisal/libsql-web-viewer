import {
  DatabaseTableColumn,
  DatabaseTableColumnConstraint,
  DatabaseTableSchemaChange,
} from "@/drivers/base-driver";
import { escapeIdentity, escapeSqlValue } from "@/drivers/sqlite/sql-helper";
import { isEqual, omit } from "lodash";

function wrapParen(str: string) {
  if (str.length >= 2 && str.startsWith("(") && str.endsWith(")")) return str;
  return "(" + str + ")";
}

function generateCreateColumn(col: DatabaseTableColumn): string {
  const tokens: string[] = [escapeIdentity(col.name), col.type];

  if (col.constraint?.primaryKey) {
    tokens.push(
      [
        "PRIMARY KEY",
        col.constraint.primaryKeyOrder,
        col.constraint.primaryKeyConflict
          ? `ON CONFLICT ${col.constraint.primaryKeyConflict}`
          : undefined,
        col.constraint.autoIncrement ? "AUTOINCREMENT" : undefined,
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  if (col.constraint?.unique) {
    tokens.push(
      [
        "UNIQUE",
        col.constraint.uniqueConflict
          ? `ON CONFLICT ${col.constraint.uniqueConflict}`
          : undefined,
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  if (col.constraint?.notNull) {
    tokens.push(
      [
        "NOT NULL",
        col.constraint.notNullConflict
          ? `ON CONFLICT ${col.constraint.notNullConflict}`
          : undefined,
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  if (col.constraint?.defaultValue) {
    tokens.push(
      ["DEFAULT", escapeSqlValue(col.constraint.defaultValue)].join(" ")
    );
  }

  if (col.constraint?.defaultExpression) {
    tokens.push(
      ["DEFAULT", wrapParen(col.constraint.defaultExpression)].join(" ")
    );
  }

  if (col.constraint?.generatedExpression) {
    tokens.push(
      [
        "GENERATED ALWAYS AS",
        wrapParen(col.constraint.generatedExpression),
        col.constraint.generatedType,
      ].join(" ")
    );
  }

  if (col.constraint?.checkExpression) {
    tokens.push("CHECK " + wrapParen(col.constraint.checkExpression));
  }

  const foreignTableName = col.constraint?.foreignKey?.foreignTableName;
  const foreignColumnName = (col.constraint?.foreignKey?.foreignColumns ?? [
    undefined,
  ])[0];

  if (foreignTableName && foreignColumnName) {
    tokens.push(
      [
        "REFERENCES",
        escapeIdentity(foreignTableName) +
          `(${escapeIdentity(foreignColumnName)})`,
      ].join(" ")
    );
  }

  return tokens.join(" ");
}

function generateConstraintScript(con: DatabaseTableColumnConstraint) {
  if (con.primaryKey) {
    return `PRIMARY KEY (${con.primaryColumns?.map(escapeIdentity).join(", ")})`;
  } else if (con.unique) {
    return `UNIQUE (${con.uniqueColumns?.map(escapeIdentity).join(", ")})`;
  } else if (con.checkExpression !== undefined) {
    return `CHECK (${con.checkExpression})`;
  } else if (con.foreignKey) {
    return (
      `CONSTRAINT ${escapeIdentity(con.name ?? `fk_`)} ` +
      `FOREIGN KEY (${con.foreignKey.columns?.map(escapeIdentity).join(", ")}) ` +
      `REFERENCES ${escapeIdentity(con.foreignKey.foreignTableName ?? "")} ` +
      `(${con.foreignKey.foreignColumns?.map(escapeIdentity).join(", ")})`
    );
  }
}

export default function generateSqlSchemaChange(
  change: DatabaseTableSchemaChange
): string[] {
  const isCreateScript = !change.name.old;

  const lines = [];

  for (const col of change.columns) {
    if (col.new === null) lines.push(`DROP COLUMN ${col.old?.name}`);
    else if (col.old === null) {
      if (isCreateScript) {
        lines.push(generateCreateColumn(col.new));
      } else {
        lines.push("ADD " + generateCreateColumn(col.new));
      }
    } else {
      // check if there is rename
      if (col.new.name !== col.old.name) {
        lines.push(
          `RENAME COLUMN ${escapeIdentity(col.old.name)} TO ${escapeIdentity(
            col.new.name
          )}`
        );
      }

      // check if there is any changed except name
      if (!isEqual(omit(col.old, ["name"]), omit(col.new, ["name"]))) {
        lines.push(
          `ALTER COLUMN ${escapeIdentity(col.new.name)} TO ${generateCreateColumn(col.new)}`
        );
      }
    }
  }

  for (const con of change.constraints) {
    if (con.new) {
      if (isCreateScript) {
        lines.push(generateConstraintScript(con.new));
      }
    }
  }

  if (!isCreateScript) {
    if (change.name.new !== change.name.old) {
      lines.push(`RENAME TO ${escapeIdentity(change.name.new ?? "")}`);
    }
  }

  if (isCreateScript) {
    return [
      `CREATE TABLE ${escapeIdentity(change.schemaName ?? "main")}.${escapeIdentity(
        change.name.new || "no_table_name"
      )}(\n${lines.map((line) => "  " + line).join(",\n")}\n)`,
    ];
  } else {
    const alter = `ALTER TABLE ${escapeIdentity(change.schemaName ?? "main")}.${escapeIdentity(change.name.old ?? "")} `;
    return lines.map((line) => alter + line);
  }
}
