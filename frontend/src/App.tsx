import type { ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/app-shell"
import { EmptyState } from "@/components/states"
import { Spinner } from "@/components/ui/spinner"
import { Toaster } from "@/components/ui/sonner"
import type { Role } from "@/lib/api"
import { AuthProvider, useAuth } from "@/lib/auth"
import { HomePage } from "@/pages/home"
import { LoginPage } from "@/pages/login"
import { ProjectDetailPage } from "@/pages/project-detail"
import { ProjectsPage } from "@/pages/projects"
import { TasksPage } from "@/pages/tasks"
import { TeamPage } from "@/pages/team"
import { TranscriptPage } from "@/pages/transcript"

function Protected({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <EmptyState title="Access denied" description="Your role cannot open this page." />
  return <>{children}</>
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <Protected>
                <AppShell />
              </Protected>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route
              path="transcript"
              element={
                <Protected roles={["ADMIN"]}>
                  <TranscriptPage />
                </Protected>
              }
            />
            <Route path="*" element={<EmptyState title="Page not found" description="This page does not exist." />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  )
}

export default App
