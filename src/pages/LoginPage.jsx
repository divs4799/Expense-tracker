import { useState } from "react";
import { loginUser, setSession } from "../storage/storage";

export function LoginPage({ onLogin, onGoRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }

    setLoading(true);
    setTimeout(() => {               // tiny delay for UX feel
      const result = loginUser(email, password);
      if (result.ok) {
        setSession(result.user);
        onLogin(result.user);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">

      {/* Brand hero */}
      <div
        className="flex flex-col items-center justify-center pt-16 pb-12 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)" }}
      >
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -left-6 bottom-0 w-28 h-28 rounded-full bg-white/[.07] pointer-events-none" />

        <div className="relative text-center text-white">
          <div className="text-5xl mb-3">💰</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Expense tracker</h1>
          <p className="text-white/70 text-sm mt-2">Track expenses together, stay on budget.</p>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 bg-base-100 rounded-t-3xl -mt-6 px-6 pt-8 pb-10">
        <h2 className="text-xl font-bold mb-1">Welcome back 👋</h2>
        <p className="text-base-content/50 text-sm mb-6">Sign in to your account</p>

        {error && (
          <div role="alert" className="alert alert-error mb-4 py-3 text-sm">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-base-content/50 mb-1">
              Email
            </label>
            <input
              type="email"
              className="input input-bordered bg-base-200 w-full"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-base-content/50 mb-1">
              Password
            </label>
            <input
              type="password"
              className="input input-bordered bg-base-200 w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <p className="text-xs text-base-content/40 -mt-1">
            Hint: password is <code className="bg-base-200 px-1 rounded">12345</code>
          </p>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner loading-sm" /> : "Sign In"}
          </button>
        </form>

        <div className="divider text-xs text-base-content/30 my-6">OR</div>

        <p className="text-center text-sm text-base-content/60">
          Don't have an account?{" "}
          <button
            onClick={onGoRegister}
            className="text-primary font-bold hover:underline"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
