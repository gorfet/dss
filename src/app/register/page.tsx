"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  id: string;
  code: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [courses, setCourses] = React.useState<Course[]>([]);

  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    studentNo: "",
    courseId: "",
  });

  React.useEffect(() => {
    fetch("/api/public/courses")
      .then((r) => r.json())
      .then((d) => setCourses(d.data ?? []))
      .catch(() => setCourses([]));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Registration failed");
      return;
    }
    toast.success("Account created — please sign in.");
    router.push("/login");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <CardTitle>Create your student account</CardTitle>
          <CardDescription>Faculty and staff accounts are created by the admin.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentNo">Student number</Label>
              <Input id="studentNo" value={form.studentNo}
                onChange={(e) => setForm({ ...form, studentNo: e.target.value })}
                placeholder="e.g., 2025-00001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} minLength={8}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Select
                value={form.courseId}
                onValueChange={(v) => setForm({ ...form, courseId: v })}
              >
                <SelectTrigger id="course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
