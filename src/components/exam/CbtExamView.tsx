import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { saveStudentAnswer } from '../../lib/examEngineService';
import { MathText } from '../common/MathText';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface CbtExamProps {
  attemptId: string;
  onFinalizeExam: () => void;
}

export const CbtExamView: React.FC<CbtExamProps> = ({ attemptId, onFinalizeExam }) => {
  const [questionsBySubject, setQuestionsBySubject] = useState<Record<string, any[]>>({});
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('Use of English');
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  
  // Set explicit 2 Hours (120 Minutes) timer
  const [deadlineAt] = useState<Date>(() => new Date(Date.now() + 120 * 60 * 1000));
  const [timeLeftStr, setTimeLeftStr] = useState<string>('120:00');
  const [isWarningFive, setIsWarningFive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initExam() {
      try {
        setLoading(true);

        const { data: dbQuestions, error } = await supabase
          .from('questions')
          .select('*')
          .order('id', { ascending: true });

        if (!error && dbQuestions && dbQuestions.length > 0 && mounted) {
          // Group questions strictly by subject
          const grouped: Record<string, any[]> = {};

          dbQuestions.forEach((q) => {
            const sub = q.subject || 'Use of English';
            if (!grouped[sub]) grouped[sub] = [];
            grouped[sub].push(q);
          });

          // Enforce JAMB quotas: 60 English, 40 for others
          const formattedGrouped: Record<string, any[]> = {};
          Object.keys(grouped).forEach((sub) => {
            const quota = sub === 'Use of English' ? 60 : 40;
            formattedGrouped[sub] = grouped[sub].slice(0, quota);
          });

          setQuestionsBySubject(formattedGrouped);
          const subs = Object.keys(formattedGrouped);
          setSubjectsList(subs);
          if (subs.length > 0) {
            setActiveSubject(subs[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initExam();

    return () => {
      mounted = false;
    };
  }, [attemptId]);

  // Synchronized 2-Hour Timer Engine
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = deadlineAt.getTime() - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeftStr('00:00');
        handleFinalize('timer_expired');
      } else {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const totalMinutes = hours * 60 + minutes;
        setTimeLeftStr(
          `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );

        if (totalMinutes < 5) setIsWarningFive(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt]);

  const activeQuestions = questionsBySubject[activeSubject] || [];
  const currentQuestion = activeQuestions[currentSubjectIndex];

  // Calculate total questions across all 4 subjects
  const totalExamQuestions = Object.values(questionsBySubject).reduce(
    (sum, list) => sum + list.length,
    0
  );

  const handleSelectOption = async (option: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setAnswers((prev) => ({ ...prev, [qId]: option }));

    try {
      await saveStudentAnswer(attemptId, qId, option);
    } catch (e) {
      console.warn('Answer saved locally.');
    }
  };

  const handleFinalize = async (reason = 'manual_submit') => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await supabase
        .from('exam_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          submission_reason: reason,
          is_finalized: true,
        })
        .eq('id', attemptId);
    } catch (e) {
      console.warn('Finalized locally.');
    }

    onFinalizeExam();
  };

  if (loading || !currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-mono text-sm gap-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Setting up JAMB CBT Examination Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-black text-white text-base">
            G
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">
              JAMB CBT SIMULATION
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Exam Ref: #{attemptId.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Timer Box (120:00) */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border font-mono text-base font-bold ${
            isWarningFive
              ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-emerald-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{timeLeftStr}</span>
        </div>

        <button
          onClick={() => handleFinalize('manual_submit')}
          disabled={submitting}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-lg transition disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question Screen */}
        <div className="lg:col-span-3 space-y-4">
          {/* Subject Tabs */}
          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 overflow-x-auto">
            {subjectsList.map((sub) => {
              const count = (questionsBySubject[sub] || []).length;
              return (
                <button
                  key={sub}
                  onClick={() => {
                    setActiveSubject(sub);
                    setCurrentSubjectIndex(0);
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                    activeSubject === sub
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{sub}</span>
                  <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Question Display Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                {activeSubject}: Question {currentSubjectIndex + 1} of {activeQuestions.length}
              </span>
              <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded text-slate-400">
                Total Exam: {totalExamQuestions} Questions
              </span>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
              <MathText text={currentQuestion.question_text || ''} />
            </div>

            {/* Options */}
            <div className="space-y-3 font-mono text-sm pt-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optKey = `option_${opt.toLowerCase()}`;
                const optionText = currentQuestion[optKey] || '';
                const isSelected = answers[currentQuestion.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-md'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {opt}
                    </span>
                    <span>
                      <MathText text={optionText} />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Nav Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                disabled={currentSubjectIndex === 0}
                onClick={() => setCurrentSubjectIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                disabled={currentSubjectIndex === activeQuestions.length - 1}
                onClick={() =>
                  setCurrentSubjectIndex((prev) =>
                    Math.min(activeQuestions.length - 1, prev + 1)
                  )
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Per-Subject Question Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
            {activeSubject} Grid (1 - {activeQuestions.length})
          </h4>

          <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto pr-1">
            {activeQuestions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentSubjectIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentSubjectIndex(idx)}
                  className={`h-9 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center ${
                    isCurrent
                      ? 'ring-2 ring-emerald-400 bg-emerald-600 text-white'
                      : isAnswered
                      ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};