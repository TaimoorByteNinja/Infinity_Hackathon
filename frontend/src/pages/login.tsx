import { useState, type FormEvent } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { AlertCircleIcon, BriefcaseIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth"

const DEMO_ACCOUNTS = [
  { email: "admin@novaworks.example", name: "Admin", role: "Admin" },
  { email: "ayesha@novaworks.example", name: "Ayesha Khan", role: "Manager" },
  { email: "bilal@novaworks.example", name: "Bilal Ahmed", role: "Manager" },
  { email: "hina@novaworks.example", name: "Hina Malik", role: "Manager" },
  { email: "ali@novaworks.example", name: "Ali Raza", role: "Agent" },
  { email: "hamza@novaworks.example", name: "Hamza Shah", role: "Agent" },
  { email: "sara@novaworks.example", name: "Sara Noor", role: "Agent" },
  { email: "usman@novaworks.example", name: "Usman Tariq", role: "Agent" },
  { email: "zain@novaworks.example", name: "Zain Abbas", role: "Agent" },
  { email: "maryam@novaworks.example", name: "Maryam Asif", role: "Agent" },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      navigate("/", { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 font-heading font-semibold">
              <BriefcaseIcon className="size-5 text-primary" /> NovaWorks CRM
            </div>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>AI Project Manager — meeting to execution.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit}>
              <FieldGroup>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy && <Spinner />} Sign in
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Demo accounts</CardTitle>
            <CardDescription>
              Seeded by the setup script. Password for every account: <code className="font-mono">Demo123!</code>. Click to fill.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {DEMO_ACCOUNTS.map((a) => (
              <Button
                key={a.email}
                variant="ghost"
                className="h-auto justify-between py-1.5"
                onClick={() => {
                  setEmail(a.email)
                  setPassword("Demo123!")
                }}
              >
                <span className="flex flex-col items-start">
                  <span>{a.name}</span>
                  <span className="text-xs text-muted-foreground">{a.email}</span>
                </span>
                <Badge variant={a.role === "Admin" ? "default" : a.role === "Manager" ? "secondary" : "outline"}>{a.role}</Badge>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
