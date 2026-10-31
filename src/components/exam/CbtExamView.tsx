import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { saveStudentAnswer, finalizeAndGradeAttempt, recordExamWarning } from '../../lib/examEngineService';
import { MathText } from '../common/MathText';
import { Clock, ChevronLeft, ChevronRight, FileText, BookOpen, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';

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

  // 120-Minute Persistent Countdown Timer
  const [deadlineAt] = useState<Date>(() => new Date(Date.now() + 120 * 60 * 1000));
  const [timeLeftStr, setTimeLeftStr] = useState<string>('120:00');
  const [isWarningFive, setIsWarningFive] = useState(false);

  // Anti-Cheat 3-Strike Warning System
  const [warningCount, setWarningCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState<{ raw: number; scaled: number } | null>(null);

  const isSubmittingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function initExamWorkspace() {
      try {
        setLoading(true);

        const { data: attemptData } = await supabase
          .from('exam_attempts')
          .select('selected_subject_ids')
          .eq('id', attemptId)
          .single();

        const selectedSubjectIds: string[] = attemptData?.selected_subject_ids || [];

        const { data: allSubjects } = await supabase
          .from('subjects')
          .select('id, code, name')
          .eq('is_active', true);

        const selectedSubjectObjects = (allSubjects || []).filter(
          (s) =>
            selectedSubjectIds.includes(s.id) ||
            selectedSubjectIds.includes(s.code) ||
            selectedSubjectIds.includes(s.name)
        );

        const chosenSubjectNames = selectedSubjectObjects.map((s) => s.name);

        const { data: dbQuestions } = await supabase
          .from('questions')
          .select('*')
          .order('id', { ascending: true });

        if (dbQuestions && mounted) {
          const grouped: Record<string, any[]> = {};

          dbQuestions.forEach((q) => {
            const qSubjectName = (q.subject || '').trim();
            const isCandidateSubject =
              chosenSubjectNames.length === 0 ||
              chosenSubjectNames.some(
                (chosenName) => chosenName.toLowerCase().trim() === qSubjectName.toLowerCase()
              );

            if (isCandidateSubject) {
              if (!grouped[qSubjectName]) grouped[qSubjectName] = [];
              grouped[qSubjectName].push(q);
            }
          });

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

  // Persistent Timer
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
    if (isSubmittingRef.current || isSubmitted) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    setIsSubmitted(true);

    try {
      const res = await finalizeAndGradeAttempt(attemptId, reason);
      if (res.success) {
        setFinalScore({ raw: res.rawScore, scaled: res.scaledScore });
      }
    } catch (e) {
      console.warn('Finalized locally.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3-Strike Anti-Cheat Protection
  useEffect(() => {
    const triggerViolation = (violationType: string) => {
      if (isSubmittingRef.current || isSubmitted) return;

      setWarningCount((prev) => {
        const nextCount = prev + 1;
        recordExamWarning(attemptId, nextCount);

        if (nextCount === 1) {
          setModalMessage(`WARNING #1: Tab switch or focus loss detected (${violationType}). Please stay on the examination screen. Strike 3 will result in immediate disqualification and auto-submission.`);
          setShowWarningModal(true);
        } else if (nextCount === 2) {
          setModalMessage(`WARNING #2 (FINAL WARNING): Security system registered focus loss. Leaving the exam tab one more time will instantly auto-submit your exam.`);
          setShowWarningModal(true);
        } else if (nextCount >= 3) {
          setShowWarningModal(false);
          handleFinalize(`disqualified_strike_3_${violationType}`);
        }
        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        triggerViolation('tab_switch');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptId, isSubmitted]);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Examination Finalized</h2>
            <p className="text-slate-400 text-xs">
              Your CBT answers have been securely evaluated and recorded.
            </p>
          </div>

          {finalScore && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                Aggregated Score
              </span>
              <div className="text-3xl font-black text-emerald-400">
                {finalScore.scaled} <span className="text-base font-normal text-slate-400">/ 400</span>
              </div>
              <div className="text-xs font-mono text-slate-400 pt-1">
                Raw Score: {finalScore.raw} / 180 Correct Questions
              </div>
            </div>
          )}

          <button
            onClick={onFinalizeExam}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
          >
            Return to Dashboard
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
        <p className="text-slate-400 font-mono">Initializing Candidate CBT Environment...</p>
      </div>
    );
  }

  const formattedText = (currentQuestion.question_text || '').replace(
    /^(English|Mathematics|Physics|Chemistry)\s+Question\s+\d+:\s*/i,
    ''
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* 3-Strike Warning Modal Popup */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-amber-300">Security Warning Issued</h3>
            <p className="text-slate-300 text-xs leading-relaxed">{modalMessage}</p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              I Understand & Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-black text-white text-base">
            G
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">
              JAMB CBT SIMULATION
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Ref: #{attemptId.slice(0, 8)}</span>
          </div>
        </div>

        {/* Anti-Cheat Warnings Pill */}
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Strikes: {warningCount} / 3</span>
        </div>

        {/* 120-Minute Timer Pill */}
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
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Subject Nav Header */}
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
                <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-mono">
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
          {currentQuestion.passage_text && (
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

          <div
            className={`${
              currentQuestion.passage_text ? 'lg:col-span-4' : 'lg:col-span-9'
            } space-y-4`}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  {activeSubject}: Question {currentSubjectIndex + 1} of {activeQuestions.length}
                </span>
                <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded text-slate-400">
                  Total Exam: {totalExamQuestions} Qs
                </span>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                <MathText text={formattedText} />
              </div>

              {/* Question Image Display */}
              {currentQuestion.image_url && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl my-3 max-w-md overflow-hidden">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-mono mb-2">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> Diagram / Reference Image
                  </div>
                  <img
                    src={currentQuestion.image_url}
                    alt="Question Diagram"
                    className="w-full max-h-64 object-contain rounded-lg border border-slate-800 bg-slate-900"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

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

              {/* Navigation Actions */}
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

          {/* Question Palette Grid */}
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