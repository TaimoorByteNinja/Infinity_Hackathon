import { Link } from "react-router-dom"
import { CalendarIcon, ClockIcon, ListChecksIcon, UserIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, type Project } from "@/lib/api"

export function ProjectCard({ project, agentView }: { project: Project; agentView?: boolean }) {
  return (
    <Link to={`/projects/${project.id}`} className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>{project.clientName}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="line-clamp-2 text-muted-foreground">{project.description}</p>
          <div className="flex items-center gap-2">
            <UserIcon className="size-4 text-muted-foreground" />
            {project.manager.name}
            <span className="text-muted-foreground">· {project.manager.specialization}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground" />
            Deadline {formatDate(project.deadline)}
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Badge variant="secondary">
            <ListChecksIcon /> {project.taskCount} {agentView ? "my " : ""}
            {project.taskCount === 1 ? "task" : "tasks"}
          </Badge>
          <Badge variant="outline">
            <ClockIcon /> {project.totalHours} h
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  )
}
