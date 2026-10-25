import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSuccess: () => void;
  onToggleRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onToggleRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setSubmitting(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid login credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-slate-100">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-xl mb-3 border border-emerald-500/20">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white">Student Sign In</h2>
        <p className="text-slate-400 text-xs mt-1">
          Enter your email and password to access your CBT portal
        </p>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6 text-center pt-4 border-t border-slate-700/60">
        <p className="text-xs text-slate-400">
          Need an account?{' '}
          <button
            onClick={onToggleRegister}
            className="text-emerald-400 font-medium hover:underline ml-1"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};