import { Link, Navigate } from "react-router-dom"
import { SparklesIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ProjectCard } from "@/components/project-card"
import { EmptyState, ErrorState, LoadingGrid } from "@/components/states"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { useFetch } from "@/lib/use-fetch"

export function HomePage() {
  const { user } = useAuth()
  const { data, error, loading } = useFetch(() => api.projects())
  if (user?.role === "AGENT") return <Navigate to="/tasks" replace />

  const projects = data?.projects ?? []
  const isAdmin = user?.role === "ADMIN"
  const stats = [
    { label: "Projects", value: projects.length },
    { label: "Tasks", value: projects.reduce((s, p) => s + p.taskCount, 0) },
    { label: "Estimated hours", value: projects.reduce((s, p) => s + p.totalHours, 0) },
  ]

  return (
    <>
      <PageHeader
        title={isAdmin ? "Company overview" : `Welcome, ${user?.name.split(" ")[0]}`}
        description={isAdmin ? "All NovaWorks projects. Paste a meeting transcript to create projects and tasks automatically." : "Projects you manage."}
        actions={
          isAdmin && (
            <Link to="/transcript" className={buttonVariants()}>
              <SparklesIcon /> Create from Transcript
            </Link>
          )
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl">{loading ? "—" : s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      {loading ? (
        <LoadingGrid />
      ) : error ? (
        <ErrorState error={error} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={isAdmin ? "Create projects and tasks from a meeting transcript." : "No projects are assigned to you yet."}
        >
          {isAdmin && (
            <Link to="/transcript" className={buttonVariants()}>
              <SparklesIcon /> Create from Transcript
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </>
  )
}
