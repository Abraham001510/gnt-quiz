import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Subject } from '../../types/database.types';
import { createFullJambAttempt } from '../../lib/examEngineService';
import { useAuth } from '../../context/AuthContext';
import { Play, Check } from 'lucide-react';

interface ExamLauncherProps {
  onStartExam: (attemptId: string) => void;
}

export const ExamLauncher: React.FC<ExamLauncherProps> = ({ onStartExam }) => {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [englishSubject, setEnglishSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubjects() {
      const { data } = await supabase.from('subjects').select('*').eq('is_active', true);
      if (data) {
        setSubjects(data);
        const eng = data.find((s) => s.code === 'ENG');
        if (eng) {
          setEnglishSubject(eng);
          setSelectedSubjectIds([eng.id]);
        }
      }
      setLoading(false);
    }

    loadSubjects();
  }, []);

  const handleToggleSubject = (id: string) => {
    if (englishSubject && id === englishSubject.id) return;

    if (selectedSubjectIds.includes(id)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((sId) => sId !== id));
    } else {
      if (selectedSubjectIds.length >= 4) {
        alert('JAMB simulation requires exactly 4 subjects (English + 3 chosen subjects).');
        return;
      }
      setSelectedSubjectIds([...selectedSubjectIds, id]);
    }
  };

  const handleLaunch = async () => {
    if (selectedSubjectIds.length !== 4) {
      setErrorMsg('Please select exactly 3 additional subjects alongside Use of English.');
      return;
    }

    if (!profile) return;

    setStarting(true);
    setErrorMsg(null);

    const res = await createFullJambAttempt(profile.id, selectedSubjectIds);
    if (res.success && res.attemptId) {
      onStartExam(res.attemptId);
    } else {
      setErrorMsg(res.error || 'Failed to start examination.');
    }
    setStarting(false);
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading examination portal...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 space-y-6 shadow-2xl text-slate-100">
      <div className="text-center space-y-2 pb-4 border-b border-slate-700">
        <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-xl mb-1 border border-emerald-500/20">
          <Play className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white">JAMB CBT Simulation Launcher</h2>
        <p className="text-slate-400 text-xs max-w-md mx-auto">
          Standard 180 Questions, 120 Minutes Duration, Synchronized Deadlines & Server Marking
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Subject Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          Select Your 4 JAMB Subjects ({selectedSubjectIds.length} / 4 Selected)
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {subjects.map((s) => {
            const isEnglish = s.code === 'ENG';
            const isSelected = selectedSubjectIds.includes(s.id);

            return (
              <button
                key={s.id}
                onClick={() => handleToggleSubject(s.id)}
                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold">{s.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {isEnglish ? '60 Questions (Mandatory)' : '40 Questions'}
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${
                    isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleLaunch}
        disabled={starting || selectedSubjectIds.length !== 4}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Play className="w-4 h-4 fill-white" />
        {starting ? 'Generating Examination Attempt...' : 'Start Full JAMB CBT Examination'}
      </button>
    </div>
  );
};