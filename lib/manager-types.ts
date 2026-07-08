// ─── Agent ───────────────────────────────────────────────────────────────────

export type AgentState = "CONNECTED" | "DISCONNECTED";

export interface Agent {
  id: string;
  device_id: string;
  token: string;
  last_seen: string;
  address: string;
  state: AgentState;
  metadata: Record<string, unknown> | null;
}

export interface AgentDetails {
  agent: Agent;
  addresses: { agent_id: string; address: string }[];
  services: AgentService[];
}

export interface AgentService {
  agent_id: string;
  name: string;
  state: string;
  created_at: string;
  updated_at: string;
}

// ─── Tool ────────────────────────────────────────────────────────────────────

export interface ToolAction {
  name: string;
  opts: string[] | null;
}

export interface Tool {
  name: string;
  actions: ToolAction[];
  os: string[];
}

export interface ToolExecution {
  id: string;
  tool_name: string;
  tool_action: string;
  tool_options: string[];
  agent_id: string;
  status: string;
  result: string;
  created_at: string;
  updated_at: string;
}

// ─── Job ─────────────────────────────────────────────────────────────────────

export type JobType = "COMMAND" | "SCRIPT";

export interface Job {
  id: string;
  name: string;
  description: string;
  type: JobType;
  target: string;
}

export interface CreateJobRequest {
  name: string;
  description: string;
  type: JobType;
  target: string;
}

// ─── Task ────────────────────────────────────────────────────────────────────

export type TaskStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface Task {
  id: string;
  job_id: string;
  agent_id: string;
  status: TaskStatus;
  result: string;
  created_at: string;
  updated_at: string;
}

export interface AssignTaskRequest {
  job_id: string;
  agent_id: string;
}

// ─── Query ───────────────────────────────────────────────────────────────────

export interface Query {
  id: string;
  name: string;
  description: string;
  sql: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

export interface CreateQueryRequest {
  name: string;
  description?: string;
  sql: string;
  platform?: string;
}

export interface UpdateQueryRequest {
  name?: string;
  description?: string;
  sql?: string;
  platform?: string;
}

export interface RunQueryRequest {
  query_id: string;
  agent_ids: string[];
}

export interface RunLiveQueryRequest {
  sql: string;
  platform?: string;
  agent_ids: string[];
}

// ─── Query Execution ─────────────────────────────────────────────────────────

export type QueryStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface QueryExecution {
  id: string;
  query_id: string;
  query: Query;
  status: QueryStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface QueryExecutionDetail {
  execution: QueryExecution;
  results: QueryExecutionResult[];
}

export interface QueryExecutionResult {
  id: string;
  execution_id: string;
  agent_id: string;
  agent: Agent;
  status: QueryStatus;
  result_json: string;
  error: string;
  started_at: string | null;
  completed_at: string | null;
}

// ─── Agent Group ─────────────────────────────────────────────────────────────

export interface AgentCriteria {
  os?: string[];
  version?: string;
  labels?: Record<string, string>;
  last_seen_within?: number;
  state?: string[];
}

export interface AgentGroup {
  id: string;
  name: string;
  description: string;
  tags: string[];
  is_dynamic: boolean;
  criteria: AgentCriteria | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  tags?: string[];
  is_dynamic?: boolean;
  criteria?: AgentCriteria;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  tags?: string[];
  is_dynamic?: boolean;
  criteria?: AgentCriteria;
}

export interface GroupMembership {
  group_id: string;
  agent_id: string;
  created_at: string;
}

/** Response shape for GET /api/groups/:id — wraps group + current member IDs */
export interface GroupDetailResponse {
  group: AgentGroup;
  agent_ids: string[];
}

// ─── Bulk Operation ──────────────────────────────────────────────────────────

export type BulkOperationType = "TASK_ASSIGN" | "QUERY_RUN" | "TOOL_EXECUTE" | "UPDATE" | "RESTART";

export type BulkOperationStatus = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED";

export interface BulkTarget {
  agent_ids?: string[];
  group_id?: string;
  all_connected?: boolean;
}

export interface BulkProgress {
  total: number;
  completed: number;
}

export interface BulkResult {
  agent_id: string;
  status: string;
  result?: string;
  error?: string;
}

export interface BulkOperation {
  id: string;
  type: BulkOperationType;
  target: BulkTarget;
  payload: unknown;
  status: BulkOperationStatus;
  progress: BulkProgress;
  results: BulkResult[];
  created_at: string;
  completed_at: string | null;
}

export interface CreateBulkOperationRequest {
  type: BulkOperationType;
  target: BulkTarget;
  payload?: unknown;
}

// ─── Certificate ─────────────────────────────────────────────────────────────

export interface SignCsrRequest {
  csr: string;
  agent_id: string;
}

export interface SignCsrResponse {
  certificate: string;
  ca_certificate?: string;
}

// ─── SSE Event ───────────────────────────────────────────────────────────────

export interface SSEEvent<T = unknown> {
  type: "agent" | "task" | "query";
  action: "created" | "updated" | "deleted" | "status_change";
  data: T;
  timestamp: string;
}
