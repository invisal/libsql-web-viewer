import {
  DatabaseTableColumnChange,
  DatabaseTableSchemaChange,
} from "@/drivers/base-driver";
import { produce } from "immer";
import { LucideKeyRound } from "lucide-react";
import { Dispatch, SetStateAction, useCallback } from "react";

export default function ColumnPrimaryKeyPopup({
  schema,
  column,
  disabled,
  onChange,
}: Readonly<{
  schema: DatabaseTableSchemaChange;
  column: DatabaseTableColumnChange;
  disabled: boolean;
  onChange: Dispatch<SetStateAction<DatabaseTableSchemaChange>>;
}>) {
  const columnName = column.new?.name;

  // Check if the column is primary key
  const isPrimaryKey = schema.constraints.some((constraint) =>
    (
      constraint.new?.primaryColumns ??
      constraint.old?.primaryColumns ??
      []
    ).includes(column.new?.name ?? column.old?.name ?? "")
  );

  const removePrimaryKey = useCallback(() => {
    onChange((prev) => {
      return produce(prev, (draft) => {
        // Finding the primary key constraint
        draft.constraints.forEach((constraint) => {
          if (constraint.new?.primaryColumns) {
            // Remove the column from the primary key constraint
            constraint.new.primaryColumns =
              constraint.new.primaryColumns.filter(
                (column) => column !== columnName
              );
          }
        });

        // Remove empty primary constraint
        draft.constraints = draft.constraints.filter((constraint) => {
          if (constraint.new?.primaryKey && constraint.new?.primaryColumns) {
            return constraint.new.primaryColumns.length > 0;
          }
          return true;
        });
      });
    });
  }, [onChange, columnName]);

  if (!isPrimaryKey) {
    return null;
  }

  return (
    <button
      className="p-1 shadow border rounded block bg-green-200 dark:bg-green-600"
      disabled={disabled}
      onClick={removePrimaryKey}
    >
      <LucideKeyRound className="w-4 h-4" />
    </button>
  );
}
