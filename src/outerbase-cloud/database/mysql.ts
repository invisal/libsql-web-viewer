import { DatabaseHeader, DatabaseResultSet } from "@/drivers/base-driver";
import {
  OuterbaseAPIQueryRawResponse,
  OuterbaseDatabaseConfig,
} from "../api-type";
import MySQLLikeDriver from "@/drivers/mysql/mysql-driver";

function transformObjectBasedResult(arr: Record<string, unknown>[]) {
  const usedColumnName = new Set();
  const columns: DatabaseHeader[] = [];

  // Build the headers based on rows
  arr.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!usedColumnName.has(key)) {
        usedColumnName.add(key);
        columns.push({
          name: key,
          displayName: key,
          originalType: null,
          type: undefined,
        });
      }
    });
  });

  return {
    data: arr,
    headers: columns,
  };
}

export class OuterbaseMySQLDriver extends MySQLLikeDriver {
  protected token: string;
  protected workspaceId: string;
  protected sourceId: string;

  constructor({ workspaceId, sourceId, token }: OuterbaseDatabaseConfig) {
    super();

    this.workspaceId = workspaceId;
    this.sourceId = sourceId;
    this.token = token;
  }

  async query(stmt: string): Promise<DatabaseResultSet> {
    const response = await fetch(
      `/api/v1/workspace/${this.workspaceId}/source/${this.sourceId}/query/raw`,
      {
        method: "POST",
        headers: {
          "x-auth-token": this.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: stmt,
        }),
      }
    );

    const jsonResponse =
      (await response.json()) as OuterbaseAPIQueryRawResponse;

    if (!jsonResponse.success) {
      throw new Error("Query failed");
    }

    const result = transformObjectBasedResult(jsonResponse.response.items);

    return {
      rows: result.data,
      headers: result.headers,
      stat: {
        rowsAffected: 0,
        rowsRead: null,
        rowsWritten: null,
        queryDurationMs: null,
      },
      lastInsertRowid: undefined,
    };
  }

  async transaction(stmts: string[]): Promise<DatabaseResultSet[]> {
    const result: DatabaseResultSet[] = [];

    for (const stms of stmts) {
      result.push(await this.query(stms));
    }

    return result;
  }

  close() {
    // Nothing to do here
  }
}
