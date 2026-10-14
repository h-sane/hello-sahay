"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, login } from "@/lib/api";
import { getSession, setSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace("/desk");
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const s = await login(email.trim(), password);
      if (s.facility_id == null) {
        setError("This is an admin account. Sign in with a hospital desk account.");
        return;
      }
      setSession(s);
      router.replace("/desk");
    } catch (err) {
      const e = err as ApiError;
      setError(
        e.kind === "network"
          ? "Cannot reach the Sahay server. Check your internet and try again."
          : e.status === 401
            ? "Wrong email or password. Check both and try again."
            : e.message,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={submit}>
        <p className="wordmark">Sahay Desk</p>
        <h1>Sign in to your hospital desk</h1>
        <p className="lede">See today&rsquo;s patients and mark them arrived.</p>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn block" disabled={pending}>
          {pending ? <><span className="spinner" aria-hidden /> Signing in</> : "Sign in"}
        </button>
      </form>
    </main>
  );
}
