"use client";
import SchemaEditor from "@/components/gui/schema-editor";
import { DatabaseTableSchemaChange } from "@/drivers/base-driver";
import { useState } from "react";

export default function SchemaEditorStorybook() {
  const [value, setValue] = useState<DatabaseTableSchemaChange>({
    name: {
      old: "",
      new: "",
    },
    columns: [],
    constraints: [],
    createScript: "",
  });

  return (
    <div className="min-h-screen bg-secondary p-4">
      <div className="max-w-[800px] border shadow bg-background">
        <SchemaEditor
          value={value}
          onChange={setValue}
          alwayUseTableConstraint
          dataTypeSuggestion={{
            type: "dropdown",
            idTypeName: "INT",
            textTypeName: "TEXT",
            dropdownOptions: [
              { text: "INT", value: "INT" },
              { text: "TEXT", value: "TEXT" },
            ],
          }}
        />
      </div>
    </div>
  );
}
