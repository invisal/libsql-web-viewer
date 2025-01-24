import OpacityLoading from "@/components/gui/loading-opacity";
import { useDatabaseDriver } from "@/context/driver-provider";
import { DatabaseTableSchemaChange } from "@/drivers/base-driver";
import { createTableSchemaDraft } from "@/lib/sql/sql-generate.schema";
import { useCallback, useEffect, useState } from "react";
import SchemaEditor from "../../schema-editor";
import SchemaEditorToolbar from "./toolbar";

interface SchemaEditorTabProps {
  tableName?: string;
  schemaName?: string;
}

const EMPTY_SCHEMA: DatabaseTableSchemaChange = {
  name: {
    old: "",
    new: "",
  },
  columns: [],
  constraints: [],
  createScript: "",
};

export default function SchemaEditorTab({
  schemaName,
  tableName,
}: Readonly<SchemaEditorTabProps>) {
  const { databaseDriver } = useDatabaseDriver();
  const [schema, setSchema] = useState<DatabaseTableSchemaChange>({
    ...EMPTY_SCHEMA,
    schemaName,
  });
  const [loading, setLoading] = useState(!!tableName);

  const fetchTable = useCallback(
    async (schemaName: string, name: string) => {
      databaseDriver
        .tableSchema(schemaName, name)
        .then((schema) => {
          setSchema(createTableSchemaDraft(schemaName, schema));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [databaseDriver, setSchema]
  );

  useEffect(() => {
    if (tableName && schemaName) {
      fetchTable(schemaName, tableName).then().catch(console.error);
    }
  }, [fetchTable, schemaName, tableName]);

  if (loading) {
    return (
      <div>
        <OpacityLoading />
      </div>
    );
  }
  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-1 border-b">
        <SchemaEditorToolbar
          value={schema}
          onChange={setSchema}
          fetchTable={fetchTable}
        />
      </div>

      <SchemaEditor
        value={schema}
        onChange={setSchema}
        dataTypeSuggestion={databaseDriver.columnTypeSelector}
        disabledEditExistingColumn={
          !databaseDriver.getFlags().supportModifyColumn
        }
      />
    </div>
  );
}
