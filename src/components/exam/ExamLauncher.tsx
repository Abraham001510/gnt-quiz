import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Subject } from '../../types/database.types';
import { createFullJambAttempt } from '../../lib/examEngineService';
import { useAuth } from '../../context/AuthContext';
import { Play, Check, ShieldAlert, CheckCircle2, Lock, AlertCircle } from 'lucide-react';

interface ExamLauncherProps {
  onStartExam: (attemptId: string) => void;
}

export const ExamLauncher: React.FC<ExamLauncherProps> = ({ onStartExam }) => {
  const auth = useAuth() as any;
  const profile = auth?.profile ?? auth?.user ?? null;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [englishSubject, setEnglishSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [hasCompletedExam, setHasCompletedExam] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function initLauncher() {
      setLoading(true);
      setErrorMsg(null);

      // 1. Guard: Check if candidate already has a finalized attempt in Supabase
      if (profile?.id) {
        const { data: attempts, error: attError } = await supabase
          .from('exam_attempts')
          .select('id, is_finalized')
          .eq('student_id', profile.id);

        if (!attError && attempts && attempts.some((att) => att.is_finalized)) {
          setHasCompletedExam(true);
          setLoading(false);
          return;
        }
      }

      // 2. Fetch active subjects from database
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!error && data) {
        setSubjects(data);
        // STRICT: Only "Use of English" (code 'ENG' or matching 'use of english') is mandatory
        const eng = data.find(
          (s) => s.code === 'ENG' || s.name.toLowerCase().trim() === 'use of english'
        );
        if (eng) {
          setEnglishSubject(eng);
          setSelectedSubjectIds([eng.id]);
        }
      }

      setLoading(false);
    }

    initLauncher();
  }, [profile]);

  const handleToggleSubject = (id: string) => {
    // Only block toggling off the mandatory "Use of English" subject
    if (englishSubject && id === englishSubject.id) return;

    if (selectedSubjectIds.includes(id)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((sId) => sId !== id));
    } else {
      if (selectedSubjectIds.length >= 4) {
        alert('JAMB UTME rules require exactly 4 subjects (Use of English + 3 chosen subjects).');
        return;
      }
      setSelectedSubjectIds([...selectedSubjectIds, id]);
    }
  };

  const handleLaunch = async () => {
    if (selectedSubjectIds.length !== 4) {
      setErrorMsg('You must select exactly 3 additional subjects alongside Use of English.');
      return;
    }

    if (!profile) {
      setErrorMsg('User session not found. Please log out and log in again.');
      return;
    }

    setStarting(true);
    setErrorMsg(null);

    const res = await createFullJambAttempt(profile.id, selectedSubjectIds);
    if (res.success && res.attemptId) {
      onStartExam(res.attemptId);
    } else {
      setErrorMsg(res.error || 'Failed to start examination. Please check your connection.');
    }
    setStarting(false);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-slate-400 font-mono text-xs gap-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p>Verifying examination authorization & subject catalogue...</p>
      </div>
    );
  }

  // Lockout View for candidates who already completed the exam
  if (hasCompletedExam) {
    return (
      <div className="max-w-xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 text-center shadow-2xl text-slate-100">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Examination Submitted & Recorded</h3>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            You have already taken and submitted your JAMB UTME CBT examination attempt. Multiple attempts are strictly restricted for this portal session.
          </p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono space-y-2 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400">Candidate ID:</span>
            <span className="text-slate-200 font-bold">{profile?.id?.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400">Portal Status:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Attempt Finalized
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Score Release:</span>
            <span className="text-slate-300">Managed by Examination Admin</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic">
          If you believe this is an error, please contact your portal administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-slate-100">
      {/* Header Banner */}
      <div className="text-center space-y-2 pb-5 border-b border-slate-800">
        <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-xl mb-1 border border-emerald-500/20">
          <Play className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          JAMB UTME CBT Simulation Launcher
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
          Standard 180 Questions • 120 Minutes Duration • Synchronized Anti-Cheat Proctoring
        </p>
      </div>

      {/* Error Alert Display */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Rules Callout */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
          <AlertCircle className="w-4 h-4" />
          <span>Important Candidate Rules</span>
        </div>
        <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
          <li>Switching tabs or minimizing the browser window will trigger <b>immediate auto-submission</b>.</li>
          <li>Scores are recorded directly in the database and released only by the administrator.</li>
          <li>You are permitted strictly <b>ONE attempt</b> on this portal.</li>
        </ul>
      </div>

      {/* Subject Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Your 4 JAMB Subjects
          </label>
          <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-emerald-400">
            {selectedSubjectIds.length} / 4 Selected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.map((s) => {
            // Strict check: Only Use of English is mandatory
            const isMandatoryEnglish =
              s.code === 'ENG' || s.name.toLowerCase().trim() === 'use of english';
            const isSelected = selectedSubjectIds.includes(s.id);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleToggleSubject(s.id)}
                className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-lg'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold flex items-center gap-2">
                    <span>{s.name}</span>
                    {isMandatoryEnglish && (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono rounded-md border border-emerald-500/30">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {isMandatoryEnglish ? '60 Questions (Section A–D)' : '40 Questions'}
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                    isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Launch Action Button */}
      <button
        onClick={handleLaunch}
        disabled={starting || selectedSubjectIds.length !== 4}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-4 rounded-xl shadow-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Play className="w-5 h-5 fill-slate-950" />
        {starting ? 'Initializing Exam Attempt & Questions...' : 'Start Full JAMB CBT Examination'}
      </button>
    </div>
  );
};