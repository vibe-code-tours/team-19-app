"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return "Password must be at least 8 characters";
    if (!/\d/.test(pw)) return "Password must contain at least 1 number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw))
      return "Password must contain at least 1 special character";
    return null;
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName || email.split("@")[0] },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative streak elements */}
      <div className="streak w-[300px] h-[3px] top-[180px] left-[40px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" style={{ filter: "blur(25px)" }} />
      <div className="streak w-[260px] h-[3px] top-[420px] -left-[10px] bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" style={{ filter: "blur(20px)" }} />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        {/* Brand — text-based */}
        <div className="text-center space-y-2">
          <h1 className="font-(family-name:--font-playfair) text-[32px] font-bold text-text-primary tracking-tight">
            SoulScript
          </h1>
          <p className="text-text-secondary text-[13px] tracking-wide">
            Your digital sanctuary for reflection
          </p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-3 px-4 py-[14px] bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(255,255,255,0.4)_inset]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-glass-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-text-muted text-[11px] font-(family-name:--font-geist-mono) uppercase tracking-[0.8px]">
              or sign up with email
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="glass rounded-2xl p-6 space-y-4 shadow-[0_1px_2px_rgba(255,255,255,0.02)_inset]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2.5 bg-white/4 border border-glass-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">
                Email
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-white/4 border border-glass-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-white/4 border border-glass-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">
                Confirm Password
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-white/4 border border-glass-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-b from-accent to-accent-glow text-white font-semibold rounded-xl shadow-[0_4px_16px_rgba(88,44,255,0.35),0_1px_2px_rgba(124,92,252,0.5)_inset] hover:shadow-[0_6px_24px_rgba(88,44,255,0.45)] transition-all disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-[13px] text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
