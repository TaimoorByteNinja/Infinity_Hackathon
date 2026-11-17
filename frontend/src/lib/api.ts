export type Role = "ADMIN" | "MANAGER" | "AGENT"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  specialization: string
  skills: string[]
}
export interface PersonRef {
  id: string
  name: string
  specialization: string
}
export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  assignee: PersonRef
  deadline: string
  estimatedHours: number
  project?: { id: string; name: string; clientName: string; manager?: PersonRef }
}
export interface Project {
  id: string
  name: string
  clientName: string
  description: string
  deadline: string
  manager: PersonRef
  taskCount: number
  totalHours: number
  createdAt: string
  tasks?: Task[]
}
export interface DraftTask {
  title: string
  description: string
  assigneeId: string
  deadline: string
  estimatedHours: number | null
}
export interface DraftProject {
  name: string
  clientName: string
  description: string
  managerId: string
  deadline: string
  tasks: DraftTask[]
}
export interface Draft {
  projects: DraftProject[]
}
export interface Issue {
  path: string
  message: string
}
export type TranscriptOutcome =
  | {
      status: "created"
      model?: string
      projects: { id: string; name: string; clientName: string; taskCount: number; totalHours: number }[]
    }
  | { status: "needs_correction"; model?: string; draft: Draft; issues: Issue[] }

export class ApiError extends Error {
  status: number
  code?: string
  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${url}`, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  // 422 from the transcript endpoints is a normal "needs correction" result
  if (res.status === 422 && data?.status === "needs_correction") return data as T
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.message ?? `Request failed (${res.status})`, data?.error?.code)
  }
  return data as T
}

export const api = {
  login: (email: string, password: string) => request<{ user: User }>("POST", "/auth/login", { email, password }),
  logout: () => request<void>("POST", "/auth/logout"),
  me: () => request<{ user: User }>("GET", "/auth/me"),
  users: () => request<{ users: User[] }>("GET", "/users"),
  projects: () => request<{ projects: Project[] }>("GET", "/projects"),
  project: (id: string) => request<{ project: Project }>("GET", `/projects/${encodeURIComponent(id)}`),
  deleteProject: (id: string) => request<void>("DELETE", `/projects/${encodeURIComponent(id)}`),
  tasks: () => request<{ tasks: Task[] }>("GET", "/tasks"),
  createFromTranscript: (transcript: string, replaceExisting: boolean) =>
    request<TranscriptOutcome>("POST", "/transcripts", { transcript, replaceExisting }),
  confirmDraft: (draft: Draft, replaceExisting: boolean) =>
    request<TranscriptOutcome>("POST", "/transcripts/confirm", { draft, replaceExisting }),
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

export const roleLabel: Record<Role, string> = { ADMIN: "Administrator", MANAGER: "Manager", AGENT: "Agent" }
