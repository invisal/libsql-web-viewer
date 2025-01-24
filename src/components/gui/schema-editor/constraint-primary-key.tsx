import { Input } from "@/components/ui/input";
import {
  DatabaseTableConstraintChange,
  DatabaseTableSchemaChange,
} from "@/drivers/base-driver";
import { Key } from "@phosphor-icons/react";
import { produce } from "immer";
import { Dispatch, SetStateAction } from "react";
import ColumnListEditor from "../column-list-editor";
import { useSchemaEditorContext } from "./schema-editor-prodiver";

export default function ConstraintPrimaryKeyEditor({
  value,
  onChange,
}: {
  value: DatabaseTableConstraintChange;
  onChange: Dispatch<SetStateAction<DatabaseTableSchemaChange>>;
}) {
  const { columns } = useSchemaEditorContext();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center font-bold text-green-600">
        <Key className="w-4 h-4" />
        Primary Key
      </div>

      <Input
        placeholder="Constraint Name"
        value={value.new?.name}
        onChange={(e) => {
          onChange((prev) => {
            return produce(prev, (draft) => {
              draft.constraints.forEach((c) => {
                if (c.id === value.id && c.new) {
                  c.new.name = e.target.value;
                }
              });
            });
          });
        }}
      />

      <div>
        <ColumnListEditor
          value={value.new?.primaryColumns ?? []}
          columns={columns.map((c) => c.new?.name).filter(Boolean) as string[]}
          onChange={(newColumns) => {
            onChange((prev) => {
              return produce(prev, (draft) => {
                draft.constraints.forEach((c) => {
                  if (c.id === value.id && c.new) {
                    c.new.primaryColumns = newColumns;
                  }
                });
              });
            });
          }}
        />
      </div>
    </div>
  );
}
