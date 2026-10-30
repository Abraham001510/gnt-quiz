import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, Phone, School, BookOpen, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const auth = useAuth() as any;
  const { login, signUp } = auth;
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredUniversity, setPreferredUniversity] = useState('Federal University of Technology, Minna (FUTMINNA)');
  const [intendedCourse, setIntendedCourse] = useState('Computer Engineering');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isRegister) {
        // 1. Authenticate user registration via Auth Context
        const { data, error } = await signUp({
          email,
          password,
          fullName,
          phoneNumber,
          preferredUniversity,
          intendedCourse,
        });

        if (error) throw error;

        // 2. Direct profile synchronization into profiles table
        const { data: userData } = await supabase.auth.getUser();
        const userId = data?.user?.id || userData?.user?.id;

        if (userId) {
          const { error: profileErr } = await supabase.from('profiles').upsert(
            {
              id: userId,
              full_name: fullName.trim(),
              email: email.trim().toLowerCase(),
              phone_number: phoneNumber.trim(),
              preferred_university: preferredUniversity.trim(),
              intended_course: intendedCourse.trim(),
              role: 'student',
            },
            { onConflict: 'id' }
          );

          if (profileErr) {
            console.warn('Direct profile upsert note:', profileErr.message);
          }
        }
      } else {
        const { error } = await login(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 font-sans">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white">
          {isRegister ? 'Create Student Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-400 text-xs">
          {isRegister
            ? 'Set up your preferences to start taking JAMB CBT practice exams'
            : 'Enter your credentials to access your CBT examination portal'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {isRegister && (
          <>
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold uppercase text-[10px]">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Abraham Otunubi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-white outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold uppercase text-[10px]">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="+234..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-white outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold uppercase text-[10px]">Target Institution</label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. FUTMINNA"
                  value={preferredUniversity}
                  onChange={(e) => setPreferredUniversity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-white outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold uppercase text-[10px]">Intended Major</label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Engineering"
                  value={intendedCourse}
                  onChange={(e) => setIntendedCourse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-white outline-none transition"
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="block text-slate-300 font-semibold uppercase text-[10px]">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-white outline-none transition"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-slate-300 font-semibold uppercase text-[10px]">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-white outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            'Authenticating...'
          ) : (
            <>
              {isRegister ? 'Register Account' : 'Sign In to Portal'} <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-800">
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setErrorMsg(null);
          }}
          className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition"
        >
          {isRegister ? 'Already have a CBT account? Sign In' : 'Need a student account? Register here'}
        </button>
      </div>
    </div>
  );
};