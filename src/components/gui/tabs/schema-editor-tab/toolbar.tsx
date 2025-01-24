import { useCommonDialog } from "@/components/common-dialog";
import { useDatabaseDriver } from "@/context/driver-provider";
import { useSchema } from "@/context/schema-provider";
import { DatabaseTableSchemaChange } from "@/drivers/base-driver";
import { checkSchemaChange } from "@/lib/sql/sql-generate.schema";
import { cloneDeep } from "lodash";
import { CodeIcon, LucideTableProperties, SaveIcon } from "lucide-react";
import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import SchemaEditorTab from ".";
import {
  Toolbar,
  ToolbarButton,
  ToolbarCodePreview,
  ToolbarSeparator,
} from "../../toolbar";
import { useTabsContext } from "../../windows-tab";

export default function SchemaEditorToolbar({
  value,
  onChange,
  fetchTable,
}: {
  value: DatabaseTableSchemaChange;
  onChange: Dispatch<SetStateAction<DatabaseTableSchemaChange>>;
  fetchTable: (schemeName: string, tableName: string) => Promise<void>;
}) {
  const { refresh: refreshSchema } = useSchema();
  const { replaceCurrentTab } = useTabsContext();
  const { databaseDriver } = useDatabaseDriver();
  const { showDialog } = useCommonDialog();

  const previewScript = useMemo(() => {
    return databaseDriver.createUpdateTableSchema(value);
  }, [value, databaseDriver]);

  const hasChange = checkSchemaChange(value);

  const onDiscard = useCallback(() => {
    onChange((prev) => {
      return {
        name: { ...prev.name, new: prev.name.old },
        columns: prev.columns
          .map((col) => ({
            key: col.key,
            old: col.old,
            new: cloneDeep(col.old),
          }))
          .filter((col) => col.old),
        constraints: prev.constraints.map((con) => ({
          id: window.crypto.randomUUID(),
          old: con.old,
          new: cloneDeep(con.old),
        })),
      };
    });
  }, [onChange]);

  const onSaveClicked = useCallback(() => {
    showDialog({
      title: "Preview",
      content: "Are you sure you want to run this change?",
      previewCode: previewScript.join("\n"),
      actions: [
        {
          text: "Continue",
          onClick: async () => {
            await databaseDriver.transaction(previewScript);

            if (value.name.new !== value.name.old) {
              refreshSchema();
              replaceCurrentTab({
                component: (
                  <SchemaEditorTab
                    tableName={value.name.new}
                    schemaName={value.schemaName}
                  />
                ),
                key: "_schema_" + value.name.new,
                identifier: "_schema_" + value.name.new,
                title: "Edit " + value.name.new,
                icon: LucideTableProperties,
              });
            } else if (value.name.old && value.schemaName) {
              fetchTable(
                value.schemaName,
                value.name?.new || value.name?.old || ""
              );
            }
          },
        },
      ],
    });
  }, [
    value,
    previewScript,
    showDialog,
    refreshSchema,
    databaseDriver,
    replaceCurrentTab,
    fetchTable,
  ]);

  return (
    <Toolbar>
      <ToolbarButton
        text="Save"
        icon={<SaveIcon/>}
        onClick={onSaveClicked}
        disabled={!hasChange}
      />

      <ToolbarButton
        text="Discard Change"
        destructive
        onClick={onDiscard}
        disabled={!hasChange}
      />
      <ToolbarSeparator />
      <ToolbarCodePreview
        text="SQL Preview"
        icon={CodeIcon}
        code={previewScript.join("\n")}
      />
      {value.createScript && (
        <ToolbarCodePreview
          text="Create Script"
          icon={CodeIcon}
          code={value.createScript}
        />
      )}
    </Toolbar>
  );
}
