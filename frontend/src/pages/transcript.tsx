import { useState } from "react"
import { Link } from "react-router-dom"
import { AlertCircleIcon, CheckCircle2Icon, FileTextIcon, RotateCcwIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"
import { DraftEditor } from "@/features/transcript/draft-editor"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { api, type Draft, type Issue, type TranscriptOutcome } from "@/lib/api"
import { SAMPLE_TRANSCRIPT } from "@/lib/sample-transcript"
import { useFetch } from "@/lib/use-fetch"

type Created = Extract<TranscriptOutcome, { status: "created" }>

export function TranscriptPage() {
  const [transcript, setTranscript] = useState("")
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<Created | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const users = useFetch(() => api.users())

  function handle(outcome: TranscriptOutcome) {
    if (outcome.status === "created") {
      setCreated(outcome)
      setDraft(null)
      setIssues([])
      toast.success(`Created ${outcome.projects.length} projects and ${outcome.projects.reduce((s, p) => s + p.taskCount, 0)} tasks`)
    } else {
      setDraft(outcome.draft)
      setIssues(outcome.issues)
    }
  }

  async function run(action: () => Promise<TranscriptOutcome>) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      handle(await action())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setCreated(null)
    setDraft(null)
    setIssues([])
    setError(null)
  }

  if (created) {
    const tasks = created.projects.reduce((s, p) => s + p.taskCount, 0)
    const hours = created.projects.reduce((s, p) => s + p.totalHours, 0)
    return (
      <>
        <PageHeader title="Projects created" description={created.model ? `Converted by ${created.model}` : "Saved after correction"} />
        <Alert className="mb-6">
          <CheckCircle2Icon />
          <AlertTitle>
            Saved {created.projects.length} projects with {tasks} tasks ({hours} estimated hours)
          </AlertTitle>
          <AlertDescription>All records were saved together in one transaction.</AlertDescription>
        </Alert>
        <div className="mb-6 rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Tasks</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {created.projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link to={`/projects/${p.id}`} className="font-medium underline-offset-4 hover:underline">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>{p.clientName}</TableCell>
                  <TableCell className="text-right">{p.taskCount}</TableCell>
                  <TableCell className="text-right">{p.totalHours}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex gap-2">
          <Link to="/" className={buttonVariants()}>
            View all projects
          </Link>
          <Button variant="outline" onClick={reset}>
            <RotateCcwIcon /> Convert another transcript
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Create from Transcript"
        description="Paste a meeting description or transcript. AI identifies projects and tasks, assigns people from the team directory, and sets deadlines and estimated hours."
      />
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircleIcon />
          <AlertTitle>Conversion failed — nothing was saved</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {draft ? (
        <div className="flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>
              {issues.length} {issues.length === 1 ? "field needs" : "fields need"} correction — nothing has been saved yet
            </AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {issues.slice(0, 8).map((i) => (
                  <li key={i.path}>{i.message}</li>
                ))}
                {issues.length > 8 && <li>…and {issues.length - 8} more (highlighted below)</li>}
              </ul>
            </AlertDescription>
          </Alert>
          <DraftEditor draft={draft} issues={issues} users={users.data?.users ?? []} onChange={setDraft} />
          <ReplaceToggle checked={replaceExisting} onChange={setReplaceExisting} />
          <div className="flex gap-2">
            <Button disabled={busy} onClick={() => run(() => api.confirmDraft(draft, replaceExisting))}>
              {busy ? <Spinner /> : <CheckCircle2Icon />} Revalidate and save
            </Button>
            <Button variant="outline" disabled={busy} onClick={reset}>
              Discard draft
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="size-4" /> Meeting transcript
            </CardTitle>
            <CardDescription>The team directory (names, roles, skills — never passwords) is sent to the AI with the transcript.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="transcript" className="justify-between">
                Transcript
                <Badge variant="outline">{transcript.length.toLocaleString()} characters</Badge>
              </FieldLabel>
              <Textarea
                id="transcript"
                className="min-h-80 font-mono text-xs"
                placeholder="Paste the meeting transcript here…"
                value={transcript}
                disabled={busy}
                onChange={(e) => setTranscript(e.target.value)}
              />
              <FieldDescription>Final decisions win: revised dates, estimates and owners are applied; rejected features are ignored.</FieldDescription>
            </Field>
            <ReplaceToggle checked={replaceExisting} onChange={setReplaceExisting} />
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
            <Button disabled={busy || !transcript.trim()} onClick={() => run(() => api.createFromTranscript(transcript, replaceExisting))}>
              {busy ? <Spinner /> : <SparklesIcon />}
              {busy ? "AI is processing the meeting…" : "Create from Transcript"}
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}>
              Load supplied meeting transcript
            </Button>
            {transcript && (
              <Button variant="ghost" disabled={busy} onClick={() => setTranscript("")}>
                Clear
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </>
  )
}

function ReplaceToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox id="replace" checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <div className="grid gap-1">
        <Label htmlFor="replace">Replace existing projects with the same name</Label>
        <p className="text-xs text-muted-foreground">Use when re-running a modified transcript, so projects are updated instead of duplicated.</p>
      </div>
    </div>
  )
}
