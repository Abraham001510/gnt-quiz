import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Phone, Mail, School, BookOpen, Clock, Award, CheckCircle2 } from 'lucide-react';

export const StudentProfileView: React.FC = () => {
  const auth = useAuth() as any;
  const profile = auth.profile ?? (auth.user
    ? {
        ...auth.user.user_metadata,
        id: auth.user.id,
        email: auth.user.email,
      }
    : null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (profile) {
        const { data } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('student_id', profile.id)
          .eq('is_finalized', true)
          .order('started_at', { ascending: false });

        setHistory(data || []);
      }
      setLoading(false);
    }
    loadHistory();
  }, [profile]);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Profile Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 font-black text-2xl shadow-inner">
            {profile?.full_name ? profile.full_name.charAt(0) : 'S'}
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">{profile?.full_name || 'Student Candidate'}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {profile?.email}</span>
              {profile?.phone_number && (
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {profile.phone_number}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs">
          <Award className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white">Verified Candidate</div>
            <div className="text-[11px] text-slate-400">UTME Candidate Account</div>
          </div>
        </div>
      </div>

      {/* Preference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><School className="w-6 h-6" /></div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Preferred University</div>
            <div className="text-sm font-bold text-white mt-0.5">{profile?.preferred_university || 'Not Set'}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl"><BookOpen className="w-6 h-6" /></div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Intended Major / Course</div>
            <div className="text-sm font-bold text-white mt-0.5">{profile?.intended_course || 'Not Set'}</div>
          </div>
        </div>
      </div>

      {/* Completed Examinations History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-3 border-b border-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" /> Completed Examinations History
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-slate-400">Loading exam records...</div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No Exam History Recorded Yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your test scores and subject performance diagnostics will automatically appear here once you complete your first CBT examination drill.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, idx) => (
              <div key={item.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>UTME Practice Attempt #{idx + 1}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      Ref: {item.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1">
                    Date: {new Date(item.started_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-400">JAMB Score</div>
                    <div className="text-lg font-black text-emerald-400 font-mono">{item.percentage_score} / 400</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};