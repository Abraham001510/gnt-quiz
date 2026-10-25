import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UserCheck, AlertCircle, Loader2 } from 'lucide-react';

interface RegisterFormProps {
  onSuccess: () => void;
  onToggleLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onToggleLogin }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredUniversity, setPreferredUniversity] = useState('');
  const [intendedCourse, setIntendedCourse] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const normalizePhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('234')) return `+${cleaned}`;
    if (cleaned.startsWith('0')) return `+234${cleaned.slice(1)}`;
    return `+234${cleaned}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !phoneNumber || !email || !password || !preferredUniversity || !intendedCourse) {
      setErrorMsg('Please fill in all required registration fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    const formattedPhone = normalizePhoneNumber(phoneNumber);

    try {
      setSubmitting(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: formattedPhone,
            preferred_university: preferredUniversity,
            intended_course: intendedCourse,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-lg w-full text-slate-100">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-xl mb-3 border border-emerald-500/20">
          <UserCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white">Student Registration</h2>
        <p className="text-slate-400 text-xs mt-1">
          Create your GNT Quiz account to access practice exams & rank on the leaderboard
        </p>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            placeholder="Abraham Otunubi"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="08012345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Email Address *
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
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Password *
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Preferred University *
            </label>
            <input
              type="text"
              required
              placeholder="FUTMINNA, UNILAG..."
              value={preferredUniversity}
              onChange={(e) => setPreferredUniversity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Intended Course *
            </label>
            <input
              type="text"
              required
              placeholder="Computer Engineering..."
              value={intendedCourse}
              onChange={(e) => setIntendedCourse(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Profile...
            </>
          ) : (
            'Complete Registration'
          )}
        </button>
      </form>

      <div className="mt-6 text-center pt-4 border-t border-slate-700/60">
        <p className="text-xs text-slate-400">
          Already registered?{' '}
          <button
            onClick={onToggleLogin}
            className="text-emerald-400 font-medium hover:underline ml-1"
          >
            Sign In here
          </button>
        </p>
      </div>
    </div>
  );
};