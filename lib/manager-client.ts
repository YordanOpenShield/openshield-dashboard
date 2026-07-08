/**
 * Typed API client for the OpenShield Agent Manager (localhost:9000).
 *
 * Server-side calls go directly to the manager API (MANAGER_API_URL env var).
 * Client-side calls use relative URLs which hit Next.js rewrites → proxy.
 *
 * Every function returns a typed promise. Errors throw with status + body.
 */

import type {
  Agent,
  AgentDetails,
  AgentGroup,
  AssignTaskRequest,
  BulkOperation,
  CreateBulkOperationRequest,
  CreateGroupRequest,
  CreateJobRequest,
  CreateQueryRequest,
  GroupDetailResponse,
  Job,
  Query,
  QueryExecution,
  QueryExecutionDetail,
  RunLiveQueryRequest,
  RunQueryRequest,
  SignCsrRequest,
  SignCsrResponse,
  Task,
  Tool,
  ToolExecution,
  UpdateGroupRequest,
  UpdateQueryRequest,
} from "./manager-types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the base URL for manager API calls.
 *
 * - Client-side: empty string (relative URLs resolve against window.location,
 *   and the Next.js rewrites in next.config.ts handle the proxying).
 * - Server-side: directly calls the manager API. Uses MANAGER_API_URL env var
 *   or falls back to http://localhost:9000.
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  return process.env.MANAGER_API_URL ?? "http://localhost:9000";
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const fullUrl = `${getBaseUrl()}${url}`;
  const res = await fetch(fullUrl, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let body = "";
    try {
      if (typeof res.text === "function") body = await (res as any).text();
    } catch {
      body = "unable to read body";
    }
    throw new Error(`Manager API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

async function apiFetchVoid(url: string, init?: RequestInit): Promise<void> {
  const fullUrl = `${getBaseUrl()}${url}`;
  const res = await fetch(fullUrl, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let body = "";
    try {
      if (typeof res.text === "function") body = await (res as any).text();
    } catch {
      body = "unable to read body";
    }
    throw new Error(`Manager API ${res.status}: ${body}`);
  }
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export function getAgentsList(init?: RequestInit): Promise<Agent[]> {
  return apiFetch<Agent[]>("/api/agents/list", init);
}

export function getAgentDetails(id: string, init?: RequestInit): Promise<AgentDetails> {
  return apiFetch<AgentDetails>(`/api/agents/${id}`, init);
}

export function getAgentTasks(id: string, init?: RequestInit): Promise<Task[]> {
  return apiFetch<Task[]>(`/api/agents/${id}/tasks`, init);
}

export function getAgentTools(id: string, init?: RequestInit): Promise<Tool[]> {
  return apiFetch<Tool[]>(`/api/agents/${id}/tools`, init);
}

export function unregisterAgent(id: string, init?: RequestInit): Promise<void> {
  return apiFetchVoid("/api/agents/unregister", {
    method: "POST",
    body: JSON.stringify({ agent_id: id }),
    ...init,
  });
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export function getJobsList(init?: RequestInit): Promise<Job[]> {
  return apiFetch<Job[]>("/api/jobs/list", init);
}

export function getJobDetails(id: string, init?: RequestInit): Promise<Job> {
  return apiFetch<Job>(`/api/jobs/${id}`, init);
}

export function createJob(data: CreateJobRequest, init?: RequestInit): Promise<Job> {
  return apiFetch<Job>("/api/jobs/create", {
    method: "POST",
    body: JSON.stringify(data),
    ...init,
  });
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export function getTasksList(init?: RequestInit): Promise<Task[]> {
  return apiFetch<Task[]>("/api/tasks/list", init);
}

export function assignTask(data: AssignTaskRequest, init?: RequestInit): Promise<Task> {
  return apiFetch<Task>("/api/tasks/assign", {
    method: "POST",
    body: JSON.stringify(data),
    ...init,
  });
}

// ─── Tools ───────────────────────────────────────────────────────────────────

export function executeTool(data: {
  tool_name: string;
  tool_action: string;
  tool_options?: string[];
  agent_id: string;
}, init?: RequestInit): Promise<ToolExecution> {
  return apiFetch<ToolExecution>("/api/tools/execute", {
    method: "POST",
    body: JSON.stringify(data),
    ...init,
  });
}

// ─── Certificates ────────────────────────────────────────────────────────────

export function signCertCsr(data: SignCsrRequest, init?: RequestInit): Promise<SignCsrResponse> {
  return apiFetch<SignCsrResponse>("/api/certs/sign", {
    method: "POST",
    body: JSON.stringify(data),
    ...init,
  });
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function getQueriesList(init?: RequestInit): Promise<Query[]> {
  return apiFetch<Query[]>("/api/queries/list", init);
}

export function getQueryDetails(id: string, init?: RequestInit): Promise<Query> {
  return apiFetch<Query>(`/api/queries/${id}`, init);
}

export function createQuery(data: CreateQueryRequest, init?: RequestInit): Promise<Query> {
  return apiFetch<Query>("/api/queries/create", {
    method: "POST",
    body: JSON.stringify(data),
    ...init,
  });
}

export function updateQuery(id: string, data: UpdateQueryRequest, init?: RequestInit): Promise<Query> {
  return apiFetch<Query>(`/api/queries/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    ...init,
  });
}

export function deleteQuery(id: string, init?: RequestInit): Promise<void> {
  return apiFetchVoid(`/api/queries/${id}`, {
    method: "DELETE",
    ...init,
  });
}

export function runQuery(data: RunQueryRequest, init?: RequestInit): Promise<QueryExecution> {
  return apiFetch<QueryExecution>("/api/queries/run", {
    method: "POST",
    body: JSON.stringify(data),
    ...init,
  });
}

export function runLiveQuery(data: RunLiveQueryRequest, init?: RequestInit): Promise<QueryExecution> {
  return apiFetch<QueryExecution>("/api/queries/run-live", {
    method: "POST",
    body: JSON.stringify(data),
    ...init,
  });
}

// ─── Query Executions ────────────────────────────────────────────────────────

export function getQueryExecutionsList(init?: RequestInit): Promise<QueryExecution[]> {
  return apiFetch<QueryExecution[]>("/api/query-executions/list", init);
}

export function getQueryExecutionDetails(id: string, init?: RequestInit): Promise<QueryExecutionDetail> {
  return apiFetch<QueryExecutionDetail>(`/api/query-executions/${id}`, init);
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export function getGroupsList(init?: RequestInit): Promise<AgentGroup[]> {
  return apiFetch<AgentGroup[]>("/api/groups", init);
}

export function getGroupDetails(id: string, init?: RequestInit): Promise<GroupDetailResponse> {
  return apiFetch<GroupDetailResponse>(`/api/groups/${id}`, init);
}

export function createGroup(data: CreateGroupRequest, init?: RequestInit): Promise<AgentGroup> {
  return apiFetch<AgentGroup>("/api/groups", {
    method: "POST",
    body: JSON.stringify(data),
    ...init,
  });
}

export function updateGroup(id: string, data: UpdateGroupRequest, init?: RequestInit): Promise<AgentGroup> {
  return apiFetch<AgentGroup>(`/api/groups/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    ...init,
  });
}

export function deleteGroup(id: string, init?: RequestInit): Promise<void> {
  return apiFetchVoid(`/api/groups/${id}`, {
    method: "DELETE",
    ...init,
  });
}

export function addAgentsToGroup(id: string, agentIds: string[], init?: RequestInit): Promise<void> {
  return apiFetchVoid(`/api/groups/${id}/agents`, {
    method: "POST",
    body: JSON.stringify({ agent_ids: agentIds }),
    ...init,
  });
}

export function removeAgentsFromGroup(id: string, agentIds: string[], init?: RequestInit): Promise<void> {
  return apiFetchVoid(`/api/groups/${id}/agents`, {
    method: "DELETE",
    body: JSON.stringify({ agent_ids: agentIds }),
    ...init,
  });
}

// ─── Bulk Operations ─────────────────────────────────────────────────────────

export function getBulkOperationsList(init?: RequestInit): Promise<BulkOperation[]> {
  return apiFetch<BulkOperation[]>("/api/bulk-operations", init);
}

export function getBulkOperationDetails(id: string, init?: RequestInit): Promise<BulkOperation> {
  return apiFetch<BulkOperation>(`/api/bulk-operations/${id}`, init);
}

export function createBulkOperation(data: CreateBulkOperationRequest, init?: RequestInit): Promise<BulkOperation> {
  return apiFetch<BulkOperation>("/api/bulk-operations", {
    method: "POST",
    body: JSON.stringify(data),
    ...init,
  });
}

export function cancelBulkOperation(id: string, init?: RequestInit): Promise<void> {
  return apiFetchVoid(`/api/bulk-operations/${id}/cancel`, {
    method: "POST",
    ...init,
  });
}
