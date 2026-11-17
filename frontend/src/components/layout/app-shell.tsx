import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  BriefcaseIcon,
  FolderKanbanIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  LogOutIcon,
  MenuIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { roleLabel } from "@/lib/api"
import { useAuth } from "@/lib/auth"

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  if (!user) return null

  const links = [
    { to: "/", label: user.role === "AGENT" ? "Overview" : "Dashboard", icon: LayoutDashboardIcon, end: true },
    { to: "/projects", label: user.role === "ADMIN" ? "All projects" : "My projects", icon: FolderKanbanIcon },
    { to: "/tasks", label: user.role === "AGENT" ? "My tasks" : "Tasks", icon: ListChecksIcon },
    { to: "/team", label: "Team", icon: UsersIcon },
    ...(user.role === "ADMIN" ? [{ to: "/transcript", label: "Create from Transcript", icon: SparklesIcon }] : []),
  ]
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)

  async function handleLogout() {
    setMenuOpen(false)
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <div className="flex items-center gap-2 font-heading font-semibold">
            <BriefcaseIcon className="size-5 text-primary" />
            <span>NovaWorks CRM</span>
          </div>

          {/* Desktop navigation */}
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <nav className="hidden flex-1 items-center gap-1 md:flex">
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
          <div className="hidden items-center gap-3 md:flex">
            <div className="hidden text-right lg:block">
              <div className="text-sm leading-tight font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.specialization}</div>
            </div>
            <Badge variant="outline">{roleLabel[user.role]}</Badge>
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Log out" title="Log out" onClick={handleLogout}>
              <LogOutIcon />
            </Button>
          </div>

          {/* Mobile navigation */}
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
                <MenuIcon />
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <BriefcaseIcon className="size-5 text-primary" /> NovaWorks CRM
                  </SheetTitle>
                  <SheetDescription>AI Project Manager</SheetDescription>
                </SheetHeader>
                <div className="flex items-center gap-3 px-4">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{user.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.specialization}</div>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {roleLabel[user.role]}
                  </Badge>
                </div>
                <Separator />
                <nav className="flex flex-col gap-1 px-2">
                  {links.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      end={l.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        buttonVariants({ variant: isActive ? "secondary" : "ghost", className: "w-full justify-start" })
                      }
                    >
                      <l.icon />
                      {l.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="mt-auto p-4">
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOutIcon /> Log out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
