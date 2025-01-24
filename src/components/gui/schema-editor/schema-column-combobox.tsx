import Combobox from "@/components/combobox";
import { useMemo } from "react";
import { useSchemaEditorContext } from "./schema-editor-prodiver";

interface SchemaColumnComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  excludedColumns?: string[];
}

export default function SchemaEditorColumnCombobox({
  value,
  onChange,
  excludedColumns,
}: SchemaColumnComboboxProps) {
  const { columns } = useSchemaEditorContext();

  const columnsList = useMemo(() => {
    const tempList = columns
      .map((c) => c.new?.name)
      .filter(Boolean) as string[];

    if (excludedColumns) {
      return tempList.filter((column) => !excludedColumns.includes(column));
    }

    return tempList;
  }, [columns, excludedColumns]);

  return (
    <Combobox
      items={columnsList.map((column) => ({ value: column, text: column }))}
      value={value}
      onChange={onChange}
    />
  );
}
