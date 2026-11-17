import { PageHeader } from "@/components/page-header"
import { ErrorState } from "@/components/states"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api, roleLabel } from "@/lib/api"
import { useFetch } from "@/lib/use-fetch"

export function TeamPage() {
  const { data, error, loading } = useFetch(() => api.users())
  return (
    <>
      <PageHeader title="Team directory" description="NovaWorks Technologies — read-only. This directory is the only source of people the AI may assign." />
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Skills</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback>{u.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "default" : u.role === "MANAGER" ? "secondary" : "outline"}>{roleLabel[u.role]}</Badge>
                  </TableCell>
                  <TableCell>{u.specialization}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-wrap gap-1">
                      {u.skills.map((s) => (
                        <Badge key={s} variant="ghost">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
