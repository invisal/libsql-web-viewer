import {
  ColumnTypeSelector,
  DatabaseTableColumnChange,
} from "@/drivers/base-driver";
import { PropsWithChildren, createContext, useContext, useMemo } from "react";

const ColumnContext = createContext<{
  columns: DatabaseTableColumnChange[];
  suggestion: ColumnTypeSelector;
  collations: string[];
}>({
  columns: [],
  collations: [],
  suggestion: {
    type: "dropdown",
    dropdownOptions: [],
  },
});

export function useSchemaEditorContext() {
  return useContext(ColumnContext);
}

export function SchemaEditorContextProvider({
  children,
  value,
  suggestion,
  collations,
  alwayUseTableConstraint,
}: PropsWithChildren<{
  value: DatabaseTableColumnChange[];
  suggestion: ColumnTypeSelector;
  collations: string[];
  alwayUseTableConstraint?: boolean;
}>) {
  const providerValue = useMemo(
    () => ({ columns: value, suggestion, collations, alwayUseTableConstraint }),
    [value, suggestion, collations, alwayUseTableConstraint]
  );

  return (
    <ColumnContext.Provider value={providerValue}>
      {children}
    </ColumnContext.Provider>
  );
}
