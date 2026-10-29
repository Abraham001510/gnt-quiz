import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { saveStudentAnswer, finalizeAndGradeAttempt } from '../../lib/examEngineService';
import { MathText } from '../common/MathText';
import { Clock, ChevronLeft, ChevronRight, FileText, BookOpen, CheckCircle2 } from 'lucide-react';

interface CbtExamProps {
  attemptId: string;
  onFinalizeExam: () => void;
}

export const CbtExamView: React.FC<CbtExamProps> = ({ attemptId, onFinalizeExam }) => {
  const [questionsBySubject, setQuestionsBySubject] = useState<Record<string, any[]>>({});
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});

  const [deadlineAt] = useState<Date>(() => new Date(Date.now() + 120 * 60 * 1000));
  const [timeLeftStr, setTimeLeftStr] = useState<string>('120:00');
  const [isWarningFive, setIsWarningFive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initExamWorkspace() {
      try {
        setLoading(true);

        // 1. Fetch current attempt to get selected_subject_ids
        const { data: attemptData, error: attemptErr } = await supabase
          .from('exam_attempts')
          .select('selected_subject_ids')
          .eq('id', attemptId)
          .single();

        if (attemptErr || !attemptData) {
          console.error('Error fetching attempt record:', attemptErr);
        }

        const selectedSubjectIds: string[] = attemptData?.selected_subject_ids || [];

        // 2. Fetch active subjects from DB to resolve names and IDs cleanly
        const { data: allSubjects } = await supabase
          .from('subjects')
          .select('id, code, name')
          .eq('is_active', true);

        // Map candidate's selected subject IDs to actual subject objects
        const selectedSubjectObjects = (allSubjects || []).filter(
          (s) =>
            selectedSubjectIds.includes(s.id) ||
            selectedSubjectIds.includes(s.code) ||
            selectedSubjectIds.includes(s.name)
        );

        // Extract clean array of candidate chosen subject names
        const chosenSubjectNames = selectedSubjectObjects.map((s) => s.name);

        // 3. Query questions from DB
        const { data: dbQuestions } = await supabase
          .from('questions')
          .select('*')
          .order('id', { ascending: true });

        if (dbQuestions && mounted) {
          const grouped: Record<string, any[]> = {};

          // Filter questions STRICTLY by the candidate's chosen subject names
          dbQuestions.forEach((q) => {
            const qSubjectName = (q.subject || '').trim();

            const isCandidateSubject = chosenSubjectNames.some(
              (chosenName) => chosenName.toLowerCase().trim() === qSubjectName.toLowerCase()
            );

            if (isCandidateSubject) {
              if (!grouped[qSubjectName]) grouped[qSubjectName] = [];
              grouped[qSubjectName].push(q);
            }
          });

          // Enforce JAMB quotas: 60 for Use of English, 40 for chosen departmental subjects
          const formattedGrouped: Record<string, any[]> = {};
          const sortedSubjectKeys = Object.keys(grouped).sort((a, b) => {
            if (a.toLowerCase().includes('english')) return -1;
            if (b.toLowerCase().includes('english')) return 1;
            return a.localeCompare(b);
          });

          sortedSubjectKeys.forEach((sub) => {
            const isEnglish = sub.toLowerCase().includes('english');
            const quota = isEnglish ? 60 : 40;
            formattedGrouped[sub] = grouped[sub].slice(0, quota);
          });

          setQuestionsBySubject(formattedGrouped);
          const subs = Object.keys(formattedGrouped);
          setSubjectsList(subs);
          if (subs.length > 0) setActiveSubject(subs[0]);
        }
      } catch (err) {
        console.error('Error loading examination workspace:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initExamWorkspace();
    return () => {
      mounted = false;
    };
  }, [attemptId]);

  // Timer Countdown Logic
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

  const handleFinalize = async (reason = 'manual_submit') => {
    if (submitting || isSubmitted) return;
    setSubmitting(true);

    await finalizeAndGradeAttempt(attemptId, reason);
    setSubmitting(false);
    setIsSubmitted(true);
  };

  useEffect(() => {
    const handleAntiCheatViolation = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        handleFinalize('auto_submit_tab_switch');
      }
    };

    const handleWindowBlur = () => {
      handleFinalize('auto_submit_window_blur');
    };

    document.addEventListener('visibilitychange', handleAntiCheatViolation);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleAntiCheatViolation);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [submitting, isSubmitted, attemptId]);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Examination Submitted Successfully</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Your answers have been recorded in the database. Scores will be published by the administrator.
          </p>
          <button
            onClick={onFinalizeExam}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Return to Portal Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activeQuestions = questionsBySubject[activeSubject] || [];
  const currentQuestion = activeQuestions[currentSubjectIndex];
  const totalExamQuestions = Object.values(questionsBySubject).reduce(
    (sum, list) => sum + list.length,
    0
  );

  const handleSelectOption = async (option: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setAnswers((prev) => ({ ...prev, [qId]: option }));
    await saveStudentAnswer(attemptId, qId, option);
  };

  if (loading || !currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-mono text-sm gap-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-mono">Loading Candidate Examination Workspace...</p>
      </div>
    );
  }

  const formattedText = (currentQuestion.question_text || '').replace(
    /^(English|Mathematics|Physics|Chemistry)\s+Question\s+\d+:\s*/i,
    ''
  );
  const hasPassage = !!currentQuestion.passage_text;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
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

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Subject Navigation Header — Displays ONLY candidate's chosen 4 subjects */}
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

        {currentQuestion.section_instruction && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-300 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-3 shadow-md">
            <BookOpen className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-emerald-400 font-bold mb-0.5 uppercase tracking-wider text-[11px]">
                Section Instruction
              </strong>
              <span>{currentQuestion.section_instruction}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {hasPassage && (
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 sticky top-20 max-h-[72vh] overflow-y-auto shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Reading Passage</span>
              </div>
              <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-line font-serif pr-1">
                {currentQuestion.passage_text}
              </div>
            </div>
          )}

          <div className={`${hasPassage ? 'lg:col-span-4' : 'lg:col-span-3'} space-y-4`}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  {activeSubject}: Question {currentSubjectIndex + 1} of {activeQuestions.length}
                </span>
                <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded text-slate-400">
                  Total Exam: {totalExamQuestions} Qs
                </span>
              </div>

              <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                {formattedText.includes('<u>') || formattedText.includes('<b>') ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: formattedText }}
                    className="[&>u]:text-emerald-400 [&>u]:font-bold [&>u]:no-underline [&>u]:border-b-2 [&>u]:border-emerald-400"
                  />
                ) : (
                  <MathText text={formattedText} />
                )}
              </div>

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

          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 sticky top-20">
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
    </div>
  );
};