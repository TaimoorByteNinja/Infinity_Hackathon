import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, CalendarIcon, ClockIcon, ListChecksIcon, Trash2Icon, UserIcon } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { EmptyState, ErrorState } from "@/components/states"
import { TaskTable } from "@/components/task-table"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api, formatDate } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { useFetch } from "@/lib/use-fetch"

export function ProjectDetailPage() {
  const { id = "" } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const { data, error, loading } = useFetch(() => api.project(id), [id])

  const back = (
    <Link to="/projects" className={buttonVariants({ variant: "ghost", size: "sm" })}>
      <ArrowLeftIcon /> Back to projects
    </Link>
  )

  if (loading) return <Skeleton className="h-96 w-full" />
  if (error || !data)
    return (
      <div className="flex flex-col gap-4">
        <div>{back}</div>
        <ErrorState error={error ?? new Error("Project not found.")} />
      </div>
    )

  const p = data.project
  const tasks = p.tasks ?? []

  async function remove() {
    try {
      await api.deleteProject(p.id)
      toast.success(`Deleted ${p.name}`)
      navigate("/projects", { replace: true })
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>{back}</div>
      <PageHeader
        title={p.name}
        description={`Client: ${p.clientName}`}
        actions={
          user?.role === "ADMIN" &&
          (confirming ? (
            <>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={remove}>
                <Trash2Icon /> Confirm delete
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setConfirming(true)}>
              <Trash2Icon /> Delete project
            </Button>
          ))
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { icon: UserIcon, label: "Project manager", value: p.manager.name, sub: p.manager.specialization },
          { icon: CalendarIcon, label: "Deadline", value: formatDate(p.deadline), sub: p.deadline },
          { icon: ListChecksIcon, label: user?.role === "AGENT" ? "My tasks" : "Tasks", value: String(p.taskCount) },
          { icon: ClockIcon, label: "Estimated hours", value: `${p.totalHours} h` },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <s.icon className="size-4" /> {s.label}
              </CardDescription>
              <CardTitle className="text-lg">{s.value}</CardTitle>
              {s.sub && <CardDescription>{s.sub}</CardDescription>}
            </CardHeader>
          </Card>
        ))}
      </div>
      {p.description && (
        <Card>
          <CardHeader>
            <CardTitle>Scope</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{p.description}</CardContent>
        </Card>
      )}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-lg font-semibold">{user?.role === "AGENT" ? "My tasks in this project" : "Tasks"}</h2>
          {user?.role === "AGENT" && <Badge variant="outline">Only your assignments are shown</Badge>}
        </div>
        {tasks.length ? <TaskTable tasks={tasks} /> : <EmptyState title="No tasks" description="This project has no tasks visible to you." />}
      </div>
    </div>
  )
}
