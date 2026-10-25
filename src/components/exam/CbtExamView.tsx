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
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [deadlineAt, setDeadlineAt] = useState<Date | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('120:00');
  const [isWarningFive, setIsWarningFive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function initExam() {
      // 1. Fetch Attempt & Deadline
      const { data: attempt } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (attempt) {
        setDeadlineAt(new Date(attempt.deadline_at));
      }

      // 2. Fetch Attempt Questions
      const { data: attemptQs } = await supabase
        .from('attempt_questions')
        .select('question_order, subject_id, questions(*)')
        .eq('attempt_id', attemptId)
        .order('question_order', { ascending: true });

      if (attemptQs) {
        const formattedQs = attemptQs.map((item: any) => ({
          ...item.questions,
          questionOrder: item.question_order,
        }));
        setQuestions(formattedQs);

        // Fetch subjects
        const subIds = Array.from(new Set(formattedQs.map((q: any) => q.subject_id)));
        const { data: subData } = await supabase.from('subjects').select('*').in('id', subIds);
        setSubjects(subData || []);
        if (subData && subData.length > 0) {
          setActiveSubjectId(subData[0].id);
        }
      }

      // 3. Fetch Saved Answers
      const { data: savedAnswers } = await supabase
        .from('student_answers')
        .select('question_id, selected_option')
        .eq('attempt_id', attemptId);

      if (savedAnswers) {
        const ansMap: Record<string, 'A' | 'B' | 'C' | 'D'> = {};
        savedAnswers.forEach((a: any) => {
          if (a.selected_option) ansMap[a.question_id] = a.selected_option;
        });
        setAnswers(ansMap);
      }

      setLoading(false);
    }

    initExam();
  }, [attemptId]);

  // Synchronized Timer Engine
  useEffect(() => {
    if (!deadlineAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = deadlineAt.getTime() - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeftStr('00:00');
        handleFinalize('timer_expired');
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeftStr(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

        if (minutes < 5) setIsWarningFive(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt]);

  const currentQuestion = questions[currentIndex];
  const subjectQuestions = questions.filter((q) => q.subject_id === activeSubjectId);

  const handleSelectOption = async (option: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setAnswers((prev) => ({ ...prev, [qId]: option }));
    await saveStudentAnswer(attemptId, qId, option);
  };

  const handleFinalize = async (reason = 'manual_submit') => {
    if (submitting) return;
    setSubmitting(true);

    await supabase
      .from('exam_attempts')
      .update({
        submitted_at: new Date().toISOString(),
        submission_reason: reason,
        is_finalized: true,
      })
      .eq('id', attemptId);

    onFinalizeExam();
  };

  if (loading || !currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-mono text-sm">
        Setting up JAMB CBT Examination Workspace...
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
            <span className="font-extrabold text-sm tracking-tight text-white block">JAMB CBT SIMULATION</span>
            <span className="text-[10px] text-slate-400 font-mono">Exam Ref: #{attemptId.slice(0, 8)}</span>
          </div>
        </div>

        {/* Timer Box */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border font-mono text-base font-bold ${
          isWarningFive
            ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 animate-pulse'
            : 'bg-slate-800 border-slate-700 text-emerald-400'
        }`}>
          <Clock className="w-4 h-4" />
          <span>{timeLeftStr}</span>
        </div>

        <button
          onClick={() => handleFinalize('manual_submit')}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-lg transition"
        >
          Submit Exam
        </button>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question Screen */}
        <div className="lg:col-span-3 space-y-4">
          {/* Subject Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 overflow-x-auto">
            {subjects.map((sub) => {
              const count = questions.filter((q) => q.subject_id === sub.id).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setActiveSubjectId(sub.id);
                    const firstIdx = questions.findIndex((q) => q.subject_id === sub.id);
                    if (firstIdx !== -1) setCurrentIndex(firstIdx);
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                    activeSubjectId === sub.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Question Display Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded text-slate-400">
                Topic: {currentQuestion.topic}
              </span>
            </div>

            {/* Render Question Text using MathText */}
            <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
              <MathText text={currentQuestion.question_text} />
            </div>

            {/* Diagram Rendering in CBT Interface */}
            {currentQuestion.image_url && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl my-3 flex justify-center">
                <img
                  src={currentQuestion.image_url}
                  alt="Question Diagram"
                  className="max-h-64 object-contain rounded-lg border border-slate-800 shadow-md"
                />
              </div>
            )}

            {/* Options rendered using MathText */}
            <div className="space-y-3 font-mono text-sm pt-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optKey = `option_${opt.toLowerCase()}`;
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
                        isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {opt}
                    </span>
                    <span>
                      <MathText text={currentQuestion[optKey]} />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Nav Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette Grid (1-180) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
            Question Navigation Grid
          </h4>

          <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto pr-1">
            {subjectQuestions.map((q) => {
              const globalIdx = questions.findIndex((item) => item.id === q.id);
              const isAnswered = !!answers[q.id];
              const isCurrent = globalIdx === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(globalIdx)}
                  className={`h-9 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center ${
                    isCurrent
                      ? 'ring-2 ring-emerald-400 bg-emerald-600 text-white'
                      : isAnswered
                      ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {globalIdx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};