import { Checkbox } from "@/components/ui/checkbox";
import {
  DatabaseTableColumnConstraint,
  DatabaseTableConstraintChange,
  DatabaseTableSchemaChange,
} from "@/drivers/base-driver";
import { cn } from "@/lib/utils";
import { Plus } from "@phosphor-icons/react";
import { produce } from "immer";
import { LucideTrash2 } from "lucide-react";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { DropdownMenuItem } from "../../ui/dropdown-menu";
import { Toolbar, ToolbarButton, ToolbarDropdown } from "../toolbar";
import ConstraintForeignKeyEditor from "./constraint-foreign-key";
import ConstraintPrimaryKeyEditor from "./constraint-primary-key";

// ---- not remove this one because maybe can be used.
/*
type ConstraintChangeHandler = (
  constraint: DatabaseTableColumnConstraint
) => void;

function ColumnCheck({
  constraint,
  onChange,
  disabled,
}: Readonly<{
  constraint: DatabaseTableColumnConstraint;
  onChange: ConstraintChangeHandler;
  disabled?: boolean;
}>) {
  return (
    <>
      <td className="border p-2">
        <LucideCheck className="w-4 h-4 inline mr-2" /> Check
      </td>
      <td className="border" colSpan={2}>
        <input
          onChange={(e) => {
            onChange({
              ...constraint,
              checkExpression: e.currentTarget.value,
            });
          }}
          readOnly={disabled}
          value={constraint.checkExpression}
          className="font-mono p-2 w-full outline-none"
        />
      </td>
    </>
  );
}

function ColumnForeignKey({
  constraint,
  onChange,
  disabled,
  schemaName,
}: Readonly<{
  constraint: DatabaseTableColumnConstraint;
  onChange: ConstraintChangeHandler;
  disabled?: boolean;
  schemaName: string;
}>) {
  const { columns } = useSchemaEditorContext();
  const { schema } = useSchema();

  const columnMemo = useMemo(() => {
    return [...new Set(columns.map((c) => c.new?.name ?? c.old?.name ?? ""))];
  }, [columns]);

  const fkColumnMemo = useMemo(() => {
    const fkTableName = constraint.foreignKey?.foreignTableName;

    if (fkTableName) {
      const fkTableSchema = (schema[schemaName] ?? []).find(
        (s) => s.type === "table" && s.name === fkTableName
      );

      if (fkTableSchema) {
        return (fkTableSchema.tableSchema?.columns ?? []).map((c) => c.name);
      }
    }

    return [];
  }, [constraint, schemaName, schema]);

  const onConstraintChange = useCallback(
    (newColumn: string[]) => {
      onChange({
        ...constraint,
        foreignKey: { ...constraint.foreignKey, columns: newColumn },
      });
    },
    [onChange, constraint]
  );

  const onFkConstraintChange = useCallback(
    (newColumn: string[]) => {
      onChange({
        ...constraint,
        foreignKey: { ...constraint.foreignKey, foreignColumns: newColumn },
      });
    },
    [onChange, constraint]
  );

  const onFkTableNameChange = useCallback(
    (fkTableName: string) => {
      onChange({
        ...constraint,
        foreignKey: { ...constraint.foreignKey, foreignTableName: fkTableName },
      });
    },
    [onChange, constraint]
  );

  return (
    <>
      <td className="border p-2">
        <LucideArrowUpRight className="w-4 h-4 inline mr-2" />
        Foreign Key
      </td>
      <td className="border">
        <TableCombobox
          borderless
          schemaName={schemaName}
          disabled={disabled}
          onChange={onFkTableNameChange}
          value={constraint.foreignKey?.foreignTableName}
        />
      </td>
      <td className="border">
        <div className="p-1 px-2 flex gap-2 items-center">
          <ColumnListEditor
            disabled={disabled}
            value={constraint.foreignKey?.columns ?? []}
            columns={columnMemo}
            onChange={onConstraintChange}
          />
          |
          <ColumnListEditor
            disabled={disabled}
            value={constraint.foreignKey?.foreignColumns ?? []}
            columns={fkColumnMemo}
            onChange={onFkConstraintChange}
          />
        </div>
      </td>
    </>
  );
}

function ColumnPrimaryKey({
  constraint,
  onChange,
  disabled,
}: Readonly<{
  constraint: DatabaseTableColumnConstraint;
  onChange: ConstraintChangeHandler;
  disabled?: boolean;
}>) {
  const { columns } = useSchemaEditorContext();

  const columnMemo = useMemo(() => {
    return [...new Set(columns.map((c) => c.new?.name ?? c.old?.name ?? ""))];
  }, [columns]);

  const onConstraintChange = useCallback(
    (newColumn: string[]) => {
      onChange({ ...constraint, primaryColumns: newColumn });
    },
    [onChange, constraint]
  );

  return (
    <>
      <td className="border p-2">
        <LucideKeySquare className="w-4 h-4 inline mr-2" />
        Primary Key
      </td>
      <td className="border" colSpan={2}>
        <div className="px-2 p-1 flex gap-2">
          <ColumnListEditor
            disabled={disabled}
            value={constraint.primaryColumns ?? []}
            columns={columnMemo}
            onChange={onConstraintChange}
          />
        </div>
      </td>
    </>
  );
}

function ColumnUnique({
  constraint,
  onChange,
  disabled,
}: Readonly<{
  constraint: DatabaseTableColumnConstraint;
  onChange: ConstraintChangeHandler;
  disabled?: boolean;
}>) {
  const { columns } = useSchemaEditorContext();

  const columnMemo = useMemo(() => {
    return [...new Set(columns.map((c) => c.new?.name ?? c.old?.name ?? ""))];
  }, [columns]);

  const onConstraintChange = useCallback(
    (newColumn: string[]) => {
      onChange({ ...constraint, uniqueColumns: newColumn });
    },
    [onChange, constraint]
  );

  return (
    <>
      <td className="border p-2">
        <LucideFingerprint className="w-4 h-4 inline mr-2" />
        Unique
      </td>
      <td className="border" colSpan={2}>
        <div className="px-2 p-1 flex gap-2">
          <ColumnListEditor
            disabled={disabled}
            value={constraint.uniqueColumns ?? []}
            columns={columnMemo}
            onChange={onConstraintChange}
          />
        </div>
      </td>
    </>
  );
}
  
function RemovableConstraintItem({
  children,
  idx,
  onChange,
}: PropsWithChildren<{
  idx: number;
  onChange: Dispatch<SetStateAction<DatabaseTableSchemaChange>>;
}>) {
  const onRemoveClicked = useCallback(() => {
    onChange((prev) => {
      let newConstraint = [...prev.constraints];
      const currentConstraint = newConstraint[idx];

      if (!currentConstraint?.old) {
        newConstraint = prev.constraints.filter((_, cIndex) => cIndex !== idx);
      } else if (currentConstraint) {
        currentConstraint.new = null;
      }

      return {
        ...prev,
        constraints: newConstraint,
      };
    });
  }, [onChange, idx]);

  return (
    <tr className="text-sm">
      {children}
      <td className="border">
        <button className="p-1" onClick={onRemoveClicked}>
          <LucideTrash2 className="w-4 h-4 text-red-500" />
        </button>
      </td>
    </tr>
  );
}


function ColumnItemBody({
  onChange,
  schemaName,
  constraint,
  disabled,
}: PropsWithChildren<{
  idx: number;
  onChange: Dispatch<SetStateAction<DatabaseTableSchemaChange>>;
  constraint: DatabaseTableConstraintChange;
  schemaName?: string;
  disabled?: boolean;
}>) {
  const onChangeConstraint = useCallback(
    (newConstraint: DatabaseTableColumnConstraint) => {
      onChange((prev) => {
        return {
          ...prev,
          constraints: prev.constraints.map((c) => {
            if (c === constraint) {
              return { ...c, new: newConstraint };
            }
            return c;
          }),
        };
      });
    },
    [onChange, constraint]
  );

  const currentConstraint = constraint.new ?? constraint.old;
  if (!currentConstraint) return null;

  if (currentConstraint.foreignKey && schemaName) {
    return (
      <ColumnForeignKey
        disabled={disabled}
        constraint={currentConstraint}
        onChange={onChangeConstraint}
        schemaName={schemaName}
      />
    );
  }

  if (currentConstraint.primaryKey) {
    return (
      <ColumnPrimaryKey
        disabled={disabled}
        constraint={currentConstraint}
        onChange={onChangeConstraint}
      />
    );
  }

  if (currentConstraint.unique) {
    return (
      <ColumnUnique
        disabled={disabled}
        constraint={currentConstraint}
        onChange={onChangeConstraint}
      />
    );
  }

  if (currentConstraint.checkExpression !== undefined) {
    return (
      <ColumnCheck
        disabled={disabled}
        constraint={currentConstraint}
        onChange={onChangeConstraint}
      />
    );
  }

  return <td colSpan={4}></td>;
}*/

/*function ColumnItem({
  constraint,
  onChange,
  idx,
  schemaName,
  disabled,
}: Readonly<{
  constraint: DatabaseTableConstraintChange;
  onChange: Dispatch<SetStateAction<DatabaseTableSchemaChange>>;
  idx: number;
  disabled?: boolean;
  schemaName?: string;
}>) {
  return (
    <RemovableConstraintItem idx={idx} onChange={onChange}>
      <ColumnItemBody
        constraint={constraint}
        onChange={onChange}
        idx={idx}
        schemaName={schemaName}
        disabled={disabled}
      />
    </RemovableConstraintItem>
  );
}*/

function ConstraintListItem({
  value,
  onChange,
}: {
  value: DatabaseTableConstraintChange;
  onChange: Dispatch<SetStateAction<DatabaseTableSchemaChange>>;
}) {
  if (value.new?.primaryKey) {
    return <ConstraintPrimaryKeyEditor value={value} onChange={onChange} />;
  } else if (value.new?.foreignKey) {
    return <ConstraintForeignKeyEditor value={value} onChange={onChange} />;
  }

  return <div>Not implemented</div>;
}

export default function SchemaEditorConstraintList({
  constraints,
  onChange,
  // schemaName,
  // disabled,
}: Readonly<{
  constraints: DatabaseTableConstraintChange[];
  onChange: Dispatch<SetStateAction<DatabaseTableSchemaChange>>;
  schemaName?: string;
  disabled?: boolean;
}>) {
  const headerClassName = "text-xs p-2 text-left border-l";
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    () => new Set()
  );

  const newConstraint = useCallback(
    (con: DatabaseTableColumnConstraint) => {
      onChange((prev) => ({
        ...prev,
        constraints: [
          ...prev.constraints,
          {
            id: window.crypto.randomUUID(),
            new: con,
            old: null,
          },
        ],
      }));
    },
    [onChange]
  );

  const hasPrimaryKey = constraints.some((c) => c.new?.primaryKey);

  const onRemoveConstraint = useCallback(() => {
    onChange((prev) => {
      return produce(prev, (draft) => {
        draft.constraints = draft.constraints.filter((col) => {
          if (selectedColumns.has(col.id) && !col.old) return false;
          return true;
        });

        draft.constraints.forEach((col) => {
          if (selectedColumns.has(col.id) && col.old) {
            col.new = null;
          }
        });
      });
    });
    setSelectedColumns(new Set());
  }, [selectedColumns, onChange, setSelectedColumns]);

  const onSelectChange = useCallback((selected: boolean, id: string) => {
    setSelectedColumns((prev) => {
      if (selected) {
        prev.add(id);
      } else {
        prev.delete(id);
      }
      return new Set(prev);
    });
  }, []);

  return (
    <div>
      <div className="border-b p-1">
        <Toolbar>
          <ToolbarDropdown text="Add Constraint" icon={<Plus />}>
            <DropdownMenuItem
              inset
              disabled={hasPrimaryKey}
              onClick={() => {
                newConstraint({ primaryKey: true });
              }}
            >
              Primary Key
            </DropdownMenuItem>
            <DropdownMenuItem
              inset
              onClick={() => {
                newConstraint({ unique: true });
              }}
            >
              Unique
            </DropdownMenuItem>
            <DropdownMenuItem
              inset
              onClick={() => {
                newConstraint({ checkExpression: "" });
              }}
            >
              Check Constraint
            </DropdownMenuItem>
            <DropdownMenuItem
              inset
              onClick={() => {
                newConstraint({
                  foreignKey: {
                    columns: [],
                  },
                });
              }}
            >
              Foreign Key
            </DropdownMenuItem>
          </ToolbarDropdown>
          <ToolbarButton
            text="Remove Constraint"
            icon={<LucideTrash2 />}
            disabled={selectedColumns.size === 0}
            onClick={onRemoveConstraint}
            destructive
          />
        </Toolbar>
      </div>
      <table className="w-full font-mono">
        <thead>
          <tr>
            <th className={cn(headerClassName, "w-[40px] bg-muted text-right")}>
              #
            </th>
            <th className={cn(headerClassName, "w-[40px]")}></th>
            <th className={cn(headerClassName)}>Constraint</th>
          </tr>
        </thead>
        <tbody>
          {constraints.map((constraint, idx) => {
            const selected = selectedColumns.has(constraint.id);
            return (
              <tr key={constraint.id}>
                <td className="border-b border-r border-t bg-muted p-2 text-right align-top text-sm">
                  {idx + 1}
                </td>
                <td
                  className="border-b border-r border-t pt-2 text-center align-top text-sm"
                  onClick={() => onSelectChange(!selected, constraint.id)}
                >
                  <Checkbox checked={selected} />
                </td>
                <td className="border-b border-r border-t p-2 text-sm">
                  <ConstraintListItem
                    key={constraint.id}
                    value={constraint}
                    onChange={onChange}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
