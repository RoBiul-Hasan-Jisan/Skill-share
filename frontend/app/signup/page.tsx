"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { AuthLayout, Field, GoogleIcon } from "@/components/auth/AuthShared";

export default function SignupPage() {
  const { signup, googleSignIn, loading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast("Name is required", "error"); return; }
    if (password.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    try {
      await signup(name.trim(), email, password);
      toast("Account created — welcome to SkillShare ✨");
      router.replace("/dashboard");
    } catch (err: any) {
      toast(err.message ?? "Something went wrong", "error");
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await googleSignIn();
      toast("Welcome to SkillShare! 🚀");
      router.replace("/dashboard");
    } catch (err: any) {
      toast(err.message ?? "Google sign-in failed", "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout mode="signup">
      <h1 className="font-display text-2xl font-bold text-white">Create your account</h1>
      <p className="mt-1 text-sm text-slate-400">Free forever for individuals.</p>

      <Button variant="outline" className="mt-4 w-full" loading={googleLoading} onClick={handleGoogle}>
        <GoogleIcon /> Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
        <span className="hairline flex-1" /> or sign up with email <span className="hairline flex-1" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <Field icon={UserIcon} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Field icon={Mail} type="email" placeholder="you@dev.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field icon={Lock} type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" loading={loading} className="w-full">
          Create account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-neon-cyan hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
