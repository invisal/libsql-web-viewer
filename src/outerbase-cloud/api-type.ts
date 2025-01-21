export interface OuterbaseDatabaseConfig {
  token: string;
  workspaceId: string;
  baseId: string;
  sourceId: string;
}

export interface OuterbaseAPIResponse<T = unknown> {
  success: boolean;
  response: T;
}

export type OuterbaseAPIQueryRawResponse = OuterbaseAPIResponse<{
  items: Record<string, unknown>[];
}>;
