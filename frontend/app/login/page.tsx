"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { AuthLayout, Field, GoogleIcon } from "@/components/auth/AuthShared";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login, googleSignIn, loading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const tryDemo = async () => {
    setDemoLoading(true);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      toast("Welcome to the demo — poke around freely 🚀");
      router.replace(from);
    } catch (err: any) {
      toast(err.message ?? "Demo account is unavailable right now", "error");
    } finally {
      setDemoLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast(`Welcome back! 👋`);
      router.replace(from);
    } catch (err: any) {
      toast(err.message ?? "Invalid credentials", "error");
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await googleSignIn();
      toast("Welcome to SkillShare! 🚀");
      router.replace(from);
    } catch (err: any) {
      toast(err.message ?? "Google sign-in failed", "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <h1 className="font-display text-2xl font-bold text-white">Log in</h1>
      <p className="mt-1 text-sm text-slate-400">Sign in to your account.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <Field icon={Mail} type="email" placeholder="you@dev.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field icon={Lock} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" loading={loading} className="w-full">
          Log in <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
        <span className="hairline flex-1" /> or <span className="hairline flex-1" />
      </div>
      <Button variant="outline" className="w-full" loading={googleLoading} onClick={handleGoogle}>
        <GoogleIcon /> Continue with Google
      </Button>
      <Button variant="subtle" className="mt-2 w-full" loading={demoLoading} onClick={tryDemo}>
        <Sparkles className="h-4 w-4" /> Try the demo account
      </Button>
      <p className="mt-6 text-center text-sm text-slate-400">
        New here?{" "}
        <Link href="/signup" className="text-neon-cyan hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
