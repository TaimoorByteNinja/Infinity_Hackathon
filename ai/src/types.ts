/** A person the AI may reference. Passwords/emails are never included. */
export interface DirectoryEntry {
  id: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "AGENT";
  specialization: string;
  skills: string[];
}

/** Normalised AI output. Fields may be empty/null — the backend validator decides validity. */
export interface DraftTask {
  title: string;
  description: string;
  assigneeId: string;
  deadline: string;
  estimatedHours: number | null;
}

export interface DraftProject {
  name: string;
  clientName: string;
  description: string;
  managerId: string;
  deadline: string;
  tasks: DraftTask[];
}

export interface TranscriptDraft {
  projects: DraftProject[];
}

export interface ExtractionResult {
  draft: TranscriptDraft;
  model: string;
}

export interface AiConfig {
  /** OpenAI-compatible base URL, e.g. https://api.groq.com/openai/v1 */
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
  fallbackModels: string[];
  timeoutMs?: number;
  appName?: string;
  appUrl?: string;
}
