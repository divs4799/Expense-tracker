import { useState } from "react";
import { loginUser, resetPassword } from "../storage/storage";
import { Wallet, AlertCircle, CheckCircle } from "lucide-react";

export function LoginPage({ onLogin, onGoRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }

    setLoading(true);
    setTimeout(async () => {               // tiny delay for UX feel
      const result = await loginUser(email, password);
      if (result.ok) {
        onLogin(result.user);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 600);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setResetSuccess(false);
    
    if (!email) {
      setError("Please enter your email address to reset password.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    if (result.ok) {
      setResetSuccess(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
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
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-xl">
            <Wallet size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Expense Tracker</h1>
          <p className="text-white/70 text-sm mt-2">Track expenses together, stay on budget.</p>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 bg-base-100 rounded-t-3xl -mt-6 px-6 pt-8 pb-10 shadow-2xl relative z-10">
        <h2 className="text-xl font-bold mb-1">
          {isResettingPassword ? "Reset Password" : "Welcome back"}
        </h2>
        <p className="text-base-content/50 text-sm mb-6">
          {isResettingPassword ? "Enter your email to receive a reset link" : "Sign in to your account"}
        </p>

        {error && (
          <div role="alert" className="alert alert-error mb-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {resetSuccess && (
          <div role="alert" className="alert alert-success mb-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle size={18} />
            <span>Password reset email sent. Please check your inbox.</span>
          </div>
        )}

        {!isResettingPassword ? (
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-base-content/50">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-primary font-semibold hover:underline"
                  onClick={() => {
                    setIsResettingPassword(true);
                    setError("");
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                className="input input-bordered bg-base-200 w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
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
            
            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Send Reset Link"}
            </button>
            
            <button
              type="button"
              className="btn btn-ghost w-full mt-2 text-sm text-base-content/60"
              onClick={() => {
                setIsResettingPassword(false);
                setError("");
                setResetSuccess(false);
              }}
              disabled={loading}
            >
              Back to Login
            </button>
          </form>
        )}

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
