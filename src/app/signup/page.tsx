"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { Eye, EyeOff, MoveRight } from "lucide-react";
import { ThemeToggle } from "../../components/ThemeToggle";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      login(data); router.push("/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-400/10 dark:bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      {/* Brush strokes */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 800 600" fill="none">
        <path d="M 700 50 C 550 100, 350 30, 200 150 C 50 270, 100 420, 250 480" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M 50 100 C 150 160, 200 80, 300 130 C 400 180, 380 300, 500 320" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="650" cy="450" r="4" fill="#8b5cf6"/>
      </svg>

      {/* Theme toggle top right */}
      <div className="absolute top-5 right-5 z-10"><ThemeToggle /></div>

      <div className="w-full max-w-[420px] relative z-10">
        <Link href="/" className="flex items-center gap-2.5 mb-8 w-fit group">
          <div className="w-7 h-7 bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">PixelSync</span>
        </Link>

        <div className="bg-white dark:bg-black/70 border border-black/8 dark:border-white/10 backdrop-blur-xl shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-600 via-violet-400 to-violet-600" />
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Create your account</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-7">Start collaborating with your team.</p>

            {error && <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-500/10 border-l-2 border-red-500 text-red-600 dark:text-red-400 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "Alex Johnson" },
                { label: "Email", key: "email", type: "email", placeholder: "alex@example.com" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-mono text-violet-600 dark:text-violet-400 mb-1.5 uppercase tracking-wider">{f.label}</label>
                  <input type={f.type} required placeholder={f.placeholder}
                    value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/70 transition-all text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-mono text-violet-600 dark:text-violet-400 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required placeholder="Min. 8 characters"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 pr-11 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/70 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="mt-2 h-12 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(124,58,237,0.25)] hover:shadow-[0_0_25px_rgba(124,58,237,0.45)] group">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <MoveRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>
          </div>
          <div className="border-t border-black/5 dark:border-white/5 py-4 text-center bg-slate-50/50 dark:bg-black/50">
            <p className="text-sm text-slate-500">Already have an account?{" "}
              <Link href="/login" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium ml-1">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
