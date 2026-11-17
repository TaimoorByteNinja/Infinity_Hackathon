import { PageHeader } from "@/components/page-header"
import { EmptyState, ErrorState } from "@/components/states"
import { TaskTable } from "@/components/task-table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { useFetch } from "@/lib/use-fetch"

export function TasksPage() {
  const { user } = useAuth()
  const { data, error, loading } = useFetch(() => api.tasks())
  const tasks = data?.tasks ?? []
  const projects = new Set(tasks.map((t) => t.projectId)).size
  const hours = tasks.reduce((s, t) => s + t.estimatedHours, 0)
  const title = { ADMIN: "All tasks", MANAGER: "Tasks in my projects", AGENT: "My tasks" }[user!.role]

  return (
    <>
      <PageHeader
        title={title}
        description={user?.role === "AGENT" ? "Tasks assigned to you across all projects." : undefined}
        actions={
          !loading && (
            <>
              <Badge variant="secondary">{tasks.length} tasks</Badge>
              <Badge variant="outline">{projects} projects</Badge>
              <Badge variant="outline">{hours} h</Badge>
            </>
          )
        }
      />
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState error={error} />
      ) : tasks.length === 0 ? (
        <EmptyState title="No tasks" description="No tasks are assigned to you yet." />
      ) : (
        <TaskTable tasks={tasks} showProject />
      )}
    </>
  )
}
