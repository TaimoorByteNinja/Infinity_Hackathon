/** JSON Schema for strict structured output (OpenAI-compatible `response_format: json_schema`). */
const task = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "assigneeId", "deadline", "estimatedHours"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    assigneeId: { type: ["string", "null"], description: "Directory id of an AGENT" },
    deadline: { type: ["string", "null"], description: "YYYY-MM-DD" },
    estimatedHours: { type: ["number", "null"] },
  },
} as const;

export const PROJECTS_JSON_SCHEMA = {
  name: "meeting_projects",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["projects"],
    properties: {
      projects: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "clientName", "description", "managerId", "deadline", "tasks"],
          properties: {
            name: { type: "string" },
            clientName: { type: "string" },
            description: { type: "string" },
            managerId: { type: ["string", "null"], description: "Directory id of a MANAGER" },
            deadline: { type: ["string", "null"], description: "YYYY-MM-DD" },
            tasks: { type: "array", items: task },
          },
        },
      },
    },
  },
} as const;
