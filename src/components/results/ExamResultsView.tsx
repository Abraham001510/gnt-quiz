import React, { useEffect, useState } from 'react';
import { calculateAndFinalizeExamResult, DetailedExamResult } from '../../lib/markingEngineService';
import { Award, CheckCircle, XCircle, Clock, BookOpen, ArrowLeft, HelpCircle, Download } from 'lucide-react';
import { downloadExamReportPdf } from '../../lib/pdfExportService';
import { useAuth } from '../../context/AuthContext';

interface ExamResultsViewProps {
  attemptId: string;
  onBackToDashboard: () => void;
}

export const ExamResultsView: React.FC<ExamResultsViewProps> = ({ attemptId, onBackToDashboard }) => {
  const { profile } = useAuth();
  const [result, setResult] = useState<DetailedExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'correct'>('all');

  useEffect(() => {
    async function loadResult() {
      const res = await calculateAndFinalizeExamResult(attemptId);
      setResult(res);
      setLoading(false);
    }

    loadResult();
  }, [attemptId]);

  if (loading || !result) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-mono text-sm space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p>Grading exam attempt and computing JAMB aggregate score...</p>
      </div>
    );
  }

  const filteredQuestions = result.questionsReview.filter((q) => {
    if (filter === 'incorrect') return !q.isCorrect;
    if (filter === 'correct') return q.isCorrect;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 text-slate-100 py-6 px-4">
      {/* Top Banner Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadExamReportPdf(result, profile?.full_name || 'Student')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download PDF Diagnostic Report
          </button>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Official JAMB CBT Examination Result
          </span>
        </div>
      </div>

      {/* Main Scorecard Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Award className="w-7 h-7 text-emerald-400" />
            <h2 className="text-2xl font-black text-white">JAMB CBT Score Summary</h2>
          </div>
          <p className="text-slate-400 text-xs">
            Ref: #{result.attemptId.slice(0, 8)} • Accuracy: {result.accuracyPercentage}% ({result.totalCorrect} / {result.totalQuestions} Correct)
          </p>
        </div>

        {/* Aggregate Score Display */}
        <div className="bg-slate-900 border-2 border-emerald-500/40 px-8 py-4 rounded-2xl text-center shadow-inner">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Score</div>
          <div className="text-4xl font-black text-emerald-400 mt-0.5">{result.jambAggregateScore} <span className="text-lg text-slate-500 font-normal">/ 400</span></div>
        </div>
      </div>

      {/* Subject Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {result.subjectBreakdowns.map((sub) => (
          <div key={sub.subjectId} className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">{sub.subjectName}</span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                {sub.scoreOutOf100} / 100
              </span>
            </div>

            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${sub.scoreOutOf100}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>Correct: {sub.correctAnswers}</span>
              <span>Wrong: {sub.wrongAnswers}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Questions Solution & Explanation Review */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-slate-700 gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" /> Detailed Questions & Solutions Review
          </h3>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({result.questionsReview.length})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filter === 'incorrect' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Incorrect ({result.questionsReview.filter((q) => !q.isCorrect).length})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filter === 'correct' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Correct ({result.totalCorrect})
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.questionId}
              className={`p-5 rounded-xl border space-y-3 ${
                q.isCorrect ? 'bg-slate-900/60 border-slate-700/80' : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold font-mono text-slate-300">
                  Q{idx + 1}. {q.subjectName} ({q.topic})
                </span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                  q.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {q.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <div className="text-sm font-medium text-slate-100">{q.questionText}</div>

              {q.imageUrl && (
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg max-w-sm">
                  <img src={q.imageUrl} alt="Diagram" className="rounded max-h-40 object-contain mx-auto" />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const optKey = `option${opt}` as keyof typeof q;
                  const isCorrectOpt = q.correctAnswer === opt;
                  const isSelectedOpt = q.selectedOption === opt;

                  return (
                    <div
                      key={opt}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        isCorrectOpt
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                          : isSelectedOpt
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{opt}.</span>
                        <span>{String(q[optKey])}</span>
                      </div>

                      {isCorrectOpt && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {!isCorrectOpt && isSelectedOpt && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                    Explanation:
                  </span>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};