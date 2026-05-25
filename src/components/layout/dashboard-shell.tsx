"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  ListChecks,
  CalendarDays,
  ClipboardList,
  Wallet,
  Megaphone,
  Bell,
  Settings,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  Building2,
  CheckSquare,
  GraduationCap as Grad,
  FileText,
  School,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNav: NavItem[] = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/departments", label: "Departments", icon: Building2 },
  { href: "/dashboard/admin/courses", label: "Courses", icon: School },
  { href: "/dashboard/admin/subjects", label: "Subjects", icon: BookOpen },
  { href: "/dashboard/admin/calendar", label: "School Calendar", icon: CalendarDays },
  { href: "/dashboard/admin/sections", label: "Sections", icon: ListChecks },
  { href: "/dashboard/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/admin/audit", label: "Audit Logs", icon: FileText },
  { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
];

const registrarNav: NavItem[] = [
  { href: "/dashboard/registrar", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/registrar/enrollments", label: "Enrollments", icon: CheckSquare },
  { href: "/dashboard/registrar/sections", label: "Sections", icon: ListChecks },
  { href: "/dashboard/registrar/students", label: "Students", icon: Users },
  { href: "/dashboard/registrar/payments", label: "Payments", icon: Wallet },
  { href: "/dashboard/registrar/reports", label: "Reports", icon: BarChart3 },
];

const facultyNav: NavItem[] = [
  { href: "/dashboard/faculty", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/faculty/classes", label: "My Classes", icon: BookOpen },
  { href: "/dashboard/faculty/grades", label: "Grades", icon: ClipboardList },
  { href: "/dashboard/faculty/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/dashboard/faculty/announcements", label: "Announcements", icon: Megaphone },
];

const studentNav: NavItem[] = [
  { href: "/dashboard/student", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/student/enroll", label: "Enroll", icon: Grad },
  { href: "/dashboard/student/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard/student/grades", label: "Grades", icon: ClipboardList },
  { href: "/dashboard/student/balance", label: "Balance", icon: Wallet },
  { href: "/dashboard/student/cor", label: "COR", icon: FileText },
  { href: "/dashboard/student/announcements", label: "Announcements", icon: Megaphone },
];

const commonNav: NavItem[] = [
  { href: "/dashboard/profile", label: "Profile", icon: Settings },
];

function navFor(role: string): NavItem[] {
  switch (role) {
    case "ADMIN":
      return adminNav;
    case "REGISTRAR":
      return registrarNav;
    case "FACULTY":
      return facultyNav;
    case "STUDENT":
      return studentNav;
    default:
      return [];
  }
}

export function DashboardShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const role = session.user.role;
  const nav = [...navFor(role), ...commonNav];
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r bg-card lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-2 border-b px-6 font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            DSS Enrollment
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {roleLabel(role)}
            </p>
            <ul className="space-y-1">
              {nav.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="border-t p-3">
            <UserMenu session={session} />
          </div>
        </aside>

        <div className="flex flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
            <div className="lg:hidden">
              <MobileNav nav={nav} role={role} />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold">
                {currentLabel(pathname, nav)}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsBell />
              <ThemeToggle />
              <div className="hidden lg:block">
                <Badge variant="info">{roleLabel(role)}</Badge>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function currentLabel(pathname: string, nav: NavItem[]) {
  const match = nav.find(
    (i) => i.href === pathname || (i.href !== "/dashboard" && pathname.startsWith(i.href)),
  );
  return match?.label ?? "Dashboard";
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="hidden h-4 w-4 dark:block" />
    </Button>
  );
}

function NotificationsBell() {
  const [count, setCount] = React.useState(0);
  const [items, setItems] = React.useState<
    { id: string; title: string; body: string; createdAt: string; read: boolean }[]
  >([]);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.data ?? []);
      setCount((data.data ?? []).filter((n: { read: boolean }) => !n.read).length);
    } catch {}
  }, []);

  React.useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    load();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">Notifications</span>
          {count > 0 && (
            <button onClick={markAll} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications</p>
          )}
          {items.slice(0, 8).map((n) => (
            <div
              key={n.id}
              className={cn(
                "px-3 py-2 text-sm",
                !n.read && "bg-primary/5",
              )}
            >
              <p className="font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ session }: { session: Session }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials(session.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium">{session.user.name}</span>
            <span className="text-xs text-muted-foreground">{session.user.email}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav({ nav, role }: { nav: NavItem[]; role: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        Menu
      </Button>
      {open && (
        <div className="absolute left-0 right-0 top-16 z-40 border-b bg-background px-4 py-3 shadow-md">
          <p className="pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {roleLabel(role)}
          </p>
          <ul className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="h-4 w-4" /> {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
