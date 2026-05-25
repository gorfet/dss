import Link from "next/link";
import { ArrowRight, GraduationCap, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <header className="container flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          DSS Enrollment
        </Link>
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              Create account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="container space-y-24 pb-24">
        <section className="grid gap-10 pt-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Modern academic operations
            </span>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Run enrollments, grades, and schedules in one place.
            </h1>
            <p className="text-balance text-lg text-muted-foreground">
              A full-stack enrollment management system for students, faculty,
              registrar, and admins — with role-based dashboards, real-time
              notifications, payments, analytics, and exportable reports.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login">
                  Sign in to your portal <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Create student account</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Demo accounts after seeding:
              <span className="ml-1 font-mono">admin@dss.local · registrar@dss.local · faculty@dss.local · student@dss.local</span>
              <span className="ml-1">(password <span className="font-mono">password123</span>)</span>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={<Layers className="h-5 w-5" />}
              title="4 role-aware dashboards"
              body="Admin, Registrar, Faculty, and Student each get a focused workspace."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Secure by default"
              body="JWT sessions, bcrypt password hashing, audit logs, and RBAC throughout."
            />
            <FeatureCard
              icon={<GraduationCap className="h-5 w-5" />}
              title="Smart enrollment"
              body="Prerequisite checks, unit limits, schedule conflict detection, and waitlists."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Analytics & reports"
              body="Enrollment trends, faculty workload, and exportable PDF/CSV reports."
            />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} DSS Enrollment</span>
          <span>Built with Next.js, Prisma, PostgreSQL.</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
