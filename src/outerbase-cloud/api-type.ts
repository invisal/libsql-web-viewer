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

export interface OuterbaseAPIAnalyticEvent {
  created_at: string;
}
export interface OuterbaseAPISource {
  model: "source";
  type: string;
  id: string;
}
export interface OuterbaseAPIBase {
  model: "base";
  short_name: string;
  access_short_name: string;
  name: string;
  id: string;
  sources: OuterbaseAPISource[];
  last_analytic_event: OuterbaseAPIAnalyticEvent;
}

export interface OuterbaseAPIWorkspace {
  model: "workspace";
  name: string;
  short_name: string;
  id: string;
  bases: OuterbaseAPIBase[];
}

export interface OuterbaseAPIWorkspaceResponse {
  items: OuterbaseAPIWorkspace[];
}

export interface OuterbaseAPIBaseResponse {
  items: OuterbaseAPIBase[];
}
