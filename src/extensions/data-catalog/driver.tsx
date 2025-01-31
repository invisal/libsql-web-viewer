export interface DataCatalogModelColumnInput {
  hideFromEzql: boolean;
  definition: string;
  samples: string[];
  virtualJoin?: {
    tableName: string;
    columnName: string;
  };
}

export interface DataCatalogModelColumn extends DataCatalogModelColumnInput {
  name: string;
}

export interface DataCatalogModelTableInput {
  definition: string;
}
export interface DataCatalogTermDefinition extends DataCatalogModelTableInput {
  id: string;
  name: string;
  otherName?: string;
}
export interface DataCatalogModelTable extends DataCatalogModelTableInput {
  schemaName: string;
  tableName: string;
  columns: Record<string, DataCatalogModelColumn>;
}

export interface DataCatalogSchemas {
  tables: Record<string, Record<string, DataCatalogModelTable>>;
  termDefinitions: DataCatalogTermDefinition[];
}

export default abstract class DataCatalogDriver {
  abstract load(): Promise<DataCatalogSchemas>;

  abstract updateColumn(
    schemaName: string,
    tableName: string,
    columnName: string,
    data: DataCatalogModelColumnInput
  ): Promise<DataCatalogModelColumn>;

  abstract updateTable(
    schemaName: string,
    tableName: string,
    data: DataCatalogModelTableInput
  ): Promise<DataCatalogModelTable>;

  abstract getColumn(
    schemaName: string,
    tableName: string,
    columnName: string
  ): DataCatalogModelColumn | undefined;

  abstract getTable(
    schemaName: string,
    tableName: string
  ): DataCatalogModelTable | undefined;

  abstract updateTermDefinition(
    data: DataCatalogTermDefinition
  ): Promise<DataCatalogTermDefinition | undefined>;

  abstract getTermDefinitions(): DataCatalogTermDefinition[] | undefined;

  abstract deleteTermDefinition(id: string): Promise<boolean>;
}
