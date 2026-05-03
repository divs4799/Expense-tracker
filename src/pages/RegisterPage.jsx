import { useState } from "react";
import { registerUser } from "../storage/storage";
import { UserPlus, Wallet, AlertCircle } from "lucide-react";

export function RegisterPage({ onRegister, onGoLogin }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirm) {
      setError("Please fill in all fields."); return;
    }
    if (password !== confirm) {
      setError("Passwords do not match."); return;
    }
    if (password.length < 3) {
      setError("Password must be at least 3 characters."); return;
    }

    setLoading(true);
    setTimeout(async () => {
      const result = await registerUser(name, email, password);
      if (result.ok) {
        onRegister(result.user);
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
        className="flex flex-col items-center justify-center pt-14 pb-10 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)" }}
      >
        <div className="absolute -left-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute right-4 bottom-0 w-24 h-24 rounded-full bg-white/[.07] pointer-events-none" />

        <div className="relative text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/30 shadow-lg">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Join Us</h1>
          <p className="text-white/70 text-sm mt-1">Start tracking with your family today.</p>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 bg-base-100 rounded-t-3xl -mt-6 px-6 pt-8 pb-10">
        <h2 className="text-xl font-bold mb-1">Join Family Budget</h2>
        <p className="text-base-content/50 text-sm mb-6">Create your free account</p>

        {error && (
          <div role="alert" className="alert alert-error mb-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-3">
          {[
            { label: "Full Name",        type: "text",     val: name,     set: setName,     ph: "John Doe",         ac: "name"             },
            { label: "Email",            type: "email",    val: email,    set: setEmail,    ph: "you@example.com",  ac: "email"            },
            { label: "Password",         type: "password", val: password, set: setPassword, ph: "Create a password", ac: "new-password"    },
            { label: "Confirm Password", type: "password", val: confirm,  set: setConfirm,  ph: "Repeat password",  ac: "new-password"     },
          ].map(({ label, type, val, set, ph, ac }) => (
            <div key={label}>
              <label className="block text-xs font-bold uppercase tracking-wider text-base-content/50 mb-1">
                {label}
              </label>
              <input
                type={type}
                className="input input-bordered bg-base-200 w-full"
                placeholder={ph}
                value={val}
                onChange={(e) => set(e.target.value)}
                autoComplete={ac}
              />
            </div>
          ))}

          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner loading-sm" /> : "Create Account"}
          </button>
        </form>

        <div className="divider text-xs text-base-content/30 my-6">OR</div>

        <p className="text-center text-sm text-base-content/60">
          Already have an account?{" "}
          <button
            onClick={onGoLogin}
            className="text-primary font-bold hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
