import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate, type Task } from "@/lib/api"

export function TaskTable({ tasks, showProject }: { tasks: Task[]; showProject?: boolean }) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Assigned agent</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead className="text-right">Est. hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="max-w-md whitespace-normal">
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.description}</div>
              </TableCell>
              {showProject && (
                <TableCell>
                  {t.project && (
                    <Link to={`/projects/${t.project.id}`} className="font-medium underline-offset-4 hover:underline">
                      {t.project.name}
                    </Link>
                  )}
                  <div className="text-xs text-muted-foreground">{t.project?.clientName}</div>
                </TableCell>
              )}
              <TableCell>
                <div>{t.assignee.name}</div>
                <div className="text-xs text-muted-foreground">{t.assignee.specialization}</div>
              </TableCell>
              <TableCell>{formatDate(t.deadline)}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline">{t.estimatedHours} h</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
