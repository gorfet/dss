"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, GraduationCap } from "lucide-react";
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

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordInner />
    </React.Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Password reset — sign in with your new password.");
      router.push("/login");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not reset password");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Choose a new password (min 8 chars).</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || !token}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
