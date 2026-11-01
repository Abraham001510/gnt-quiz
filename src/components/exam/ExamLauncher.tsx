import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { BookOpen, CheckCircle2, Lock, ArrowRight, ShieldAlert } from 'lucide-react';

interface ExamLauncherProps {
  onStartExam: (attemptId: string) => void;
}

export const ExamLauncher: React.FC<ExamLauncherProps> = ({ onStartExam }) => {
  const { user } = useAuth() as any;
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActiveSubjects() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (!error && data) {
          setSubjects(data);
          // Default selection to Use of English
          const englishSub = data.find((s) => s.name.toLowerCase().includes('english'));
          if (englishSub) {
            setSelectedSubjectIds([englishSub.id]);
          }
        }
      } catch (err) {
        console.error('Error loading subjects:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveSubjects();
  }, []);

  const handleToggleSubject = (subId: string, subName: string) => {
    const isEnglish = subName.toLowerCase().includes('english');
    if (isEnglish) return; // English is mandatory

    setSelectedSubjectIds((prev) => {
      if (prev.includes(subId)) {
        return prev.filter((id) => id !== subId);
      } else {
        if (prev.length >= 4) return prev;
        return [...prev, subId];
      }
    });
  };

  const handleLaunch = async () => {
    if (selectedSubjectIds.length !== 4) {
      setErrorMsg('Please select exactly 4 subjects (Use of English + 3 departmental subjects).');
      return;
    }

    setCreating(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .insert([
          {
            student_id: user.id,
            selected_subject_ids: selectedSubjectIds,
            is_finalized: false,
            created_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      if (error) throw error;
      if (data) {
        onStartExam(data.id);
      }
    } catch (err: any) {
      console.error('Error creating exam attempt:', err);
      setErrorMsg(err.message || 'Failed to initialize examination session.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs space-y-2">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading UTME Subject Combinations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-slate-100 py-6 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" /> Configure Candidate UTME Subjects
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Select <strong>Use of English</strong> and exactly 3 additional subjects to start your 180-question simulation.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.map((sub) => {
            const isEnglish = sub.name.toLowerCase().includes('english');
            const isSelected = selectedSubjectIds.includes(sub.id);

            return (
              <button
                key={sub.id}
                onClick={() => handleToggleSubject(sub.id, sub.name)}
                className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div>
                  <span className="block font-bold text-sm">{sub.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {isEnglish ? 'Mandatory (60 Qs)' : 'Departmental (40 Qs)'}
                  </span>
                </div>

                {isEnglish ? (
                  <Lock className="w-4 h-4 text-slate-600" />
                ) : isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-mono text-slate-400">
            Selected: <strong className="text-emerald-400">{selectedSubjectIds.length} / 4</strong> Subjects
          </span>

          <button
            onClick={handleLaunch}
            disabled={creating || selectedSubjectIds.length !== 4}
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {creating ? 'Initializing Exam...' : 'Start CBT Examination'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};