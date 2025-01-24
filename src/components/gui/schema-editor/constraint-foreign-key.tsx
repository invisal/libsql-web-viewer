import { Input } from "@/components/ui/input";
import {
  DatabaseTableConstraintChange,
  DatabaseTableSchemaChange,
} from "@/drivers/base-driver";
import { Key, Plus } from "@phosphor-icons/react";
import { produce } from "immer";
import { ArrowRight, Trash2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import TableColumnCombobox from "../table-combobox/TableColumnCombobox";
import TableCombobox from "../table-combobox/TableCombobox";
import SchemaEditorColumnCombobox from "./schema-column-combobox";
import SchemaNameSelect from "./schema-name-select";

export default function ConstraintForeignKeyEditor({
  value,
  onChange,
}: {
  value: DatabaseTableConstraintChange;
  onChange: Dispatch<SetStateAction<DatabaseTableSchemaChange>>;
}) {
  const columnSourceList =
    value.new?.foreignKey?.columns ?? value.old?.foreignKey?.columns ?? [];

  const columnDestinationList =
    value.new?.foreignKey?.foreignColumns ??
    value.old?.foreignKey?.foreignColumns ??
    [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 font-bold text-purple-600">
        <Key className="h-4 w-4" />
        Foreign Key
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

      <div className="font-semibold">Reference Table</div>
      <div className="flex gap-2">
        <SchemaNameSelect
          onChange={(e) => {
            onChange((prev) => {
              return produce(prev, (draft) => {
                draft.constraints.forEach((c) => {
                  if (c.id === value.id && c.new) {
                    (c.new.foreignKey || {}).foreignSchemaName = e;
                  }
                });
              });
            });
          }}
          value={value.new?.foreignKey?.foreignSchemaName}
        />
        <div className="w-[250px]">
          <TableCombobox
            schemaName={value.new?.foreignKey?.foreignSchemaName ?? "main"}
            onChange={(e) => {
              onChange((prev) => {
                return produce(prev, (draft) => {
                  draft.constraints.forEach((c) => {
                    if (c.id === value.id && c.new) {
                      (c.new.foreignKey || {}).foreignTableName = e;
                    }
                  });
                });
              });
            }}
            value={value.new?.foreignKey?.foreignTableName}
          />
        </div>
      </div>

      <div className="ml-4 flex flex-col gap-2 border-l-4 pl-4">
        {columnSourceList.map((column, columnIdx) => {
          return (
            <div className="flex items-center gap-2" key={columnIdx}>
              {columnSourceList.length > 1 && (
                <div>
                  <button
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white"
                    onClick={() => {
                      onChange((prev) => {
                        return produce(prev, (draft) => {
                          draft.constraints.forEach((c) => {
                            if (c.id === value.id && c.new?.foreignKey) {
                              c.new.foreignKey.columns =
                                columnSourceList.filter(
                                  (_, idx) => idx !== columnIdx
                                );
                              c.new.foreignKey.foreignColumns =
                                columnDestinationList.filter(
                                  (_, idx) => idx !== columnIdx
                                );
                            }
                          });
                        });
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="w-[200px]">
                <SchemaEditorColumnCombobox
                  onChange={(e) => {
                    onChange((prev) => {
                      return produce(prev, (draft) => {
                        draft.constraints.forEach((c) => {
                          if (c.id === value.id && c.new && c.new.foreignKey) {
                            if (
                              c.id === value.id &&
                              c.new &&
                              c.new.foreignKey
                            ) {
                              if ((c.new.foreignKey.columns || []).length > 0) {
                                (c.new.foreignKey.columns || [])[columnIdx] = e;
                              }
                            }
                          }
                        });
                      });
                    });
                  }}
                  value={column}
                />
              </div>
              <ArrowRight className="h-4 w-4" />
              <TableColumnCombobox
                onChange={(e) => {
                  onChange((prev) => {
                    return produce(prev, (draft) => {
                      draft.constraints.forEach((c) => {
                        if (c.id === value.id && c.new && c.new.foreignKey) {
                          if (
                            (c.new.foreignKey.foreignColumns || []).length > 0
                          ) {
                            (c.new.foreignKey.foreignColumns || [])[columnIdx] =
                              e;
                          } else {
                            c.new.foreignKey.foreignColumns = [e];
                          }
                        }
                      });
                    });
                  });
                }}
                value={
                  (value.new?.foreignKey?.foreignColumns || [])[columnIdx]
                    ? (value.new?.foreignKey?.foreignColumns || [])[columnIdx]
                    : undefined
                }
                schemaName={value.new?.foreignKey?.foreignSchemaName ?? ""}
                tableName={value.new?.foreignKey?.foreignTableName ?? ""}
              />
            </div>
          );
        })}

        <button
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-green-600 text-white"
          onClick={() => {
            onChange((prev) => {
              return produce(prev, (draft) => {
                draft.constraints.forEach((c) => {
                  if (c.id === value.id && c.new?.foreignKey) {
                    c.new.foreignKey.columns = [...columnSourceList, ""];
                    c.new.foreignKey.foreignColumns = [
                      ...columnDestinationList,
                      "",
                    ];
                  }
                });
              });
            });
          }}
        >
          <Plus className="h-4 w-4" weight="bold" />
        </button>
      </div>
    </div>
  );
}
