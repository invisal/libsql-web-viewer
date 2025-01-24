import { InlineTab, InlineTabItem } from "@/components/inline-tab";
import {
  ColumnTypeSelector,
  DatabaseTableSchemaChange,
} from "@/drivers/base-driver";
import { produce } from "immer";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { Input } from "../../ui/input";
import SchemaEditorColumnList from "./schema-editor-column-list";
import SchemaEditorConstraintList from "./schema-editor-constraint-list";
import { SchemaEditorContextProvider } from "./schema-editor-prodiver";
import SchemaNameSelect from "./schema-name-select";

interface Props {
  value: DatabaseTableSchemaChange;
  onChange: Dispatch<SetStateAction<DatabaseTableSchemaChange>>;

  /**
   * Some database does not support editing existing column such as Sqlite
   */
  disabledEditExistingColumn?: boolean;

  /**
   * Tell the editor to always use table constraint instead of column constraint
   * for primary key and foreign key.
   *
   * ```sql
   * -- Using column constraint style
   * CREATE TABLE exampleTable(
   *   id INTEGER PRIMARY KEY
   * )
   * ```
   * To
   * ```sql
   * -- Using table constraint style
   * CREATE TABLE exampleTable(
   *  id INTEGER,
   *  PRIMARY KEY(id)
   * )
   * ```
   */
  alwayUseTableConstraint?: boolean;

  /**
   * Provide column data type suggestion
   */
  dataTypeSuggestion: ColumnTypeSelector;
  collations?: string[];
}

export default function SchemaEditor({
  value,
  onChange,
  disabledEditExistingColumn,
  dataTypeSuggestion,
  collations,
}: Readonly<Props>) {
  const [selectedTab, setSelectedTab] = useState(0);
  const isCreateScript = value.name.old === "";

  const onAddColumn = useCallback(() => {
    onChange(
      produce(value, (draft) => {
        let columnName = value.columns.length === 0 ? "id" : "column";

        // Dictorary of used column name
        const columnNameSet = new Set(
          value.columns.map((c) => (c.new?.name ?? c.old?.name)?.toLowerCase())
        );

        if (columnNameSet.has(columnName)) {
          // Finding the next available column name
          let columnSuffix = 2;
          while (columnNameSet.has(`${columnName}${columnSuffix}`)) {
            columnSuffix++;
          }

          columnName = `${columnName}${columnSuffix}`;
        }

        const newColumn =
          value.columns.length === 0
            ? {
                name: "id",
                type: dataTypeSuggestion.idTypeName ?? "INTEGER",
              }
            : {
                name: columnName,
                type: dataTypeSuggestion.textTypeName ?? "TEXT",
                constraint: {},
              };

        draft.columns.push({
          key: window.crypto.randomUUID(),
          old: null,
          new: newColumn,
        });

        if (value.columns.length === 0) {
          draft.constraints.push({
            id: window.crypto.randomUUID(),
            old: null,
            new: {
              primaryKey: true,
              primaryColumns: ["id"],
            },
          });
        }
      })
    );
  }, [value, onChange, dataTypeSuggestion]);

  return (
    <>
      <div className="grow-0 shrink-0">
        <div className="flex items-center mx-3 mt-3 mb-4 ml-5 gap-2">
          <div>
            <Input
              placeholder="Table Name"
              value={value.name.new ?? value.name.old ?? ""}
              onChange={(e) => {
                onChange(
                  produce(value, (draft) => {
                    draft.name.new = e.target.value;
                  })
                );
              }}
              className="w-[200px]"
            />
          </div>
          <div>
            <SchemaNameSelect
              readonly={!isCreateScript}
              value={value.schemaName}
              onChange={(selectedSchema) => {
                onChange(
                  produce(value, (draft) => {
                    draft.schemaName = selectedSchema;
                  })
                );
              }}
            />
          </div>
        </div>
      </div>
      <div className="grow overflow-y-auto">
        <SchemaEditorContextProvider
          value={value.columns}
          suggestion={dataTypeSuggestion}
          collations={collations ?? []}
        >
          <InlineTab selected={selectedTab} onChange={setSelectedTab}>
            <InlineTabItem
              title={
                value.columns.length > 0
                  ? `Columns (${value.columns.length})`
                  : "Columns"
              }
            >
              <SchemaEditorColumnList
                value={value}
                onChange={onChange}
                onAddColumn={onAddColumn}
                disabledEditExistingColumn={disabledEditExistingColumn}
              />
            </InlineTabItem>
            <InlineTabItem
              title={
                value.constraints.length > 0
                  ? `Constraints (${value.constraints.length})`
                  : "Constraints"
              }
            >
              <SchemaEditorConstraintList
                schemaName={value.schemaName}
                constraints={value.constraints}
                onChange={onChange}
                disabled={!isCreateScript}
              />
            </InlineTabItem>
            <InlineTabItem title="Indexes">Indexes</InlineTabItem>
          </InlineTab>
        </SchemaEditorContextProvider>
      </div>
    </>
  );
}
