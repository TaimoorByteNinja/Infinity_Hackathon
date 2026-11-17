import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { BriefcaseIcon, FolderKanbanIcon, LayoutDashboardIcon, ListChecksIcon, LogOutIcon, SparklesIcon, UsersIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { roleLabel } from "@/lib/api"
import { useAuth } from "@/lib/auth"

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  const links = [
    { to: "/", label: user.role === "AGENT" ? "Overview" : "Dashboard", icon: LayoutDashboardIcon, end: true },
    { to: "/projects", label: user.role === "ADMIN" ? "All projects" : "My projects", icon: FolderKanbanIcon },
    { to: "/tasks", label: user.role === "AGENT" ? "My tasks" : "Tasks", icon: ListChecksIcon },
    { to: "/team", label: "Team", icon: UsersIcon },
    ...(user.role === "ADMIN" ? [{ to: "/transcript", label: "Create from Transcript", icon: SparklesIcon }] : []),
  ]
  const initials = user.name.split(" ").map((p) => p[0]).join("").slice(0, 2)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <div className="flex items-center gap-2 font-heading font-semibold">
            <BriefcaseIcon className="size-5 text-primary" />
            <span>NovaWorks CRM</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" })}
              >
                <l.icon />
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.specialization}</div>
            </div>
            <Badge variant="outline">{roleLabel[user.role]}</Badge>
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Log out"
              onClick={async () => {
                await logout()
                navigate("/login", { replace: true })
              }}
            >
              <LogOutIcon />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
