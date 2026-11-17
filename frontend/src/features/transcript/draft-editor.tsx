import { PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { Draft, DraftProject, DraftTask, Issue, User } from "@/lib/api"

interface Props {
  draft: Draft
  issues: Issue[]
  users: User[]
  onChange: (draft: Draft) => void
}

/** Editable view of an AI draft. Fields with validation issues are highlighted so the admin can correct them. */
export function DraftEditor({ draft, issues, users, onChange }: Props) {
  const issueAt = (path: string) => issues.find((i) => i.path === path)?.message
  const managers = users.filter((u) => u.role === "MANAGER").map((u) => ({ value: u.id, label: `${u.name} (${u.id})` }))
  const agents = users.filter((u) => u.role === "AGENT").map((u) => ({ value: u.id, label: `${u.name} (${u.id})` }))

  const setProject = (i: number, patch: Partial<DraftProject>) =>
    onChange({ projects: draft.projects.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) })
  const setTask = (i: number, j: number, patch: Partial<DraftTask>) =>
    setProject(i, { tasks: draft.projects[i]!.tasks.map((t, idx) => (idx === j ? { ...t, ...patch } : t)) })

  return (
    <div className="flex flex-col gap-4">
      {draft.projects.map((p, i) => {
        const pp = `projects.${i}`
        return (
          <Card key={i}>
            <CardHeader>
              <CardTitle>{p.name || `Project ${i + 1}`}</CardTitle>
              <CardAction>
                <Button variant="ghost" size="sm" onClick={() => onChange({ projects: draft.projects.filter((_, idx) => idx !== i) })}>
                  <Trash2Icon /> Remove project
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {issueAt(`${pp}.tasks`) && <FieldError>{issueAt(`${pp}.tasks`)}</FieldError>}
              <FieldGroup className="grid gap-4 md:grid-cols-2">
                <Field data-invalid={!!issueAt(`${pp}.name`)}>
                  <FieldLabel>Project name</FieldLabel>
                  <Input aria-invalid={!!issueAt(`${pp}.name`)} value={p.name} onChange={(e) => setProject(i, { name: e.target.value })} />
                  <FieldError>{issueAt(`${pp}.name`)}</FieldError>
                </Field>
                <Field data-invalid={!!issueAt(`${pp}.clientName`)}>
                  <FieldLabel>Client</FieldLabel>
                  <Input aria-invalid={!!issueAt(`${pp}.clientName`)} value={p.clientName} onChange={(e) => setProject(i, { clientName: e.target.value })} />
                  <FieldError>{issueAt(`${pp}.clientName`)}</FieldError>
                </Field>
                <Field data-invalid={!!issueAt(`${pp}.managerId`)}>
                  <FieldLabel>Project manager</FieldLabel>
                  <PersonSelect items={managers} value={p.managerId} invalid={!!issueAt(`${pp}.managerId`)} onChange={(v) => setProject(i, { managerId: v })} />
                  <FieldError>{issueAt(`${pp}.managerId`)}</FieldError>
                </Field>
                <Field data-invalid={!!issueAt(`${pp}.deadline`)}>
                  <FieldLabel>Project deadline</FieldLabel>
                  <Input type="date" aria-invalid={!!issueAt(`${pp}.deadline`)} value={p.deadline} onChange={(e) => setProject(i, { deadline: e.target.value })} />
                  <FieldError>{issueAt(`${pp}.deadline`)}</FieldError>
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <Textarea value={p.description} onChange={(e) => setProject(i, { description: e.target.value })} />
                </Field>
              </FieldGroup>
              <div className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {p.tasks.map((t, j) => {
                      const tp = `${pp}.tasks.${j}`
                      const errs = ["title", "assigneeId", "deadline", "estimatedHours"].map((f) => issueAt(`${tp}.${f}`)).filter(Boolean)
                      return (
                        <TableRow key={j} className="align-top">
                          <TableCell className="min-w-64 whitespace-normal">
                            <Input aria-invalid={!!issueAt(`${tp}.title`)} value={t.title} onChange={(e) => setTask(i, j, { title: e.target.value })} />
                            <Textarea className="mt-2 min-h-12 text-xs" value={t.description} onChange={(e) => setTask(i, j, { description: e.target.value })} />
                            {errs.map((m) => (
                              <FieldError key={m} className="mt-1">
                                {m}
                              </FieldError>
                            ))}
                          </TableCell>
                          <TableCell>
                            <PersonSelect items={agents} value={t.assigneeId} invalid={!!issueAt(`${tp}.assigneeId`)} onChange={(v) => setTask(i, j, { assigneeId: v })} />
                          </TableCell>
                          <TableCell>
                            <Input type="date" aria-invalid={!!issueAt(`${tp}.deadline`)} value={t.deadline} onChange={(e) => setTask(i, j, { deadline: e.target.value })} />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0.5}
                              step={0.5}
                              className="w-24"
                              aria-invalid={!!issueAt(`${tp}.estimatedHours`)}
                              value={t.estimatedHours ?? ""}
                              onChange={(e) => setTask(i, j, { estimatedHours: e.target.value === "" ? null : Number(e.target.value) })}
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" aria-label="Remove task" onClick={() => setProject(i, { tasks: p.tasks.filter((_, idx) => idx !== j) })}>
                              <Trash2Icon />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProject(i, { tasks: [...p.tasks, { title: "", description: "", assigneeId: "", deadline: p.deadline, estimatedHours: null }] })}
                >
                  <PlusIcon /> Add task
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function PersonSelect({ items, value, invalid, onChange }: { items: { value: string; label: string }[]; value: string; invalid: boolean; onChange: (v: string) => void }) {
  const known = items.some((i) => i.value === value)
  return (
    <Select items={items} value={known ? value : null} onValueChange={(v) => onChange((v as string | null) ?? "")}>
      <SelectTrigger aria-invalid={invalid} className="w-full min-w-44">
        <SelectValue placeholder={value ? `Unknown: ${value}` : "Select person"} />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
