import { PageHeader } from "@/components/page-header"
import { ProjectCard } from "@/components/project-card"
import { EmptyState, ErrorState, LoadingGrid } from "@/components/states"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { useFetch } from "@/lib/use-fetch"

export function ProjectsPage() {
  const { user } = useAuth()
  const { data, error, loading } = useFetch(() => api.projects())
  const desc = {
    ADMIN: "Every project in the company.",
    MANAGER: "Projects where you are the project manager.",
    AGENT: "Projects that contain tasks assigned to you.",
  }[user!.role]

  return (
    <>
      <PageHeader title={user?.role === "ADMIN" ? "All projects" : "My projects"} description={desc} />
      {loading ? (
        <LoadingGrid />
      ) : error ? (
        <ErrorState error={error} />
      ) : !data?.projects.length ? (
        <EmptyState title="No projects" description="There are no projects visible to your account." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((p) => (
            <ProjectCard key={p.id} project={p} agentView={user?.role === "AGENT"} />
          ))}
        </div>
      )}
    </>
  )
}
