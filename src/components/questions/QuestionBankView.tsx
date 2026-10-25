import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Question, Subject } from '../../types/database.types';
import { seedQuestionBank } from '../../lib/seedQuestions';
import { deleteQuestionPermanently } from '../../lib/questionService';
import { autoCorrectQuestion, ProposedCorrection } from '../../lib/autoCorrectService';
import { AutoCorrectModal } from '../admin/AutoCorrectModal';
import { MathText } from '../common/MathText';
import { Database, FileText, CheckCircle2, RefreshCw, Trash2, Sparkles } from 'lucide-react';

export const QuestionBankView: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [activeCorrection, setActiveCorrection] = useState<ProposedCorrection | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const { data: subData } = await supabase.from('subjects').select('*').order('name');
      setSubjects(subData || []);

      let query = supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (selectedSubjectId !== 'all') {
        query = query.eq('subject_id', selectedSubjectId);
      }

      const { data: qData, error: qError } = await query;
      if (qError) throw qError;

      setQuestions(qData || []);
    } catch (err: any) {
      console.error('Error loading question bank:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedSubjectId]);

  const handleSeedQuestions = async () => {
    setSeeding(true);
    setStatusMsg(null);
    const res = await seedQuestionBank();
    if (res.success) {
      setStatusMsg(`Successfully seeded ${res.count} verified past questions into the question bank!`);
      await loadData();
    } else {
      setStatusMsg(`Seeding notice: ${res.error}`);
    }
    setSeeding(false);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this question from the Question Bank?')) {
      const success = await deleteQuestionPermanently(id);
      if (success) {
        setStatusMsg('Question deleted successfully!');
        await loadData();
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        alert('Failed to delete question. Please check database permissions.');
      }
    }
  };

  const handleRunAutoCorrect = (q: Question) => {
    const proposal = autoCorrectQuestion(q);
    if (!proposal) {
      alert('No mathematical formatting or calculation issues detected in this question!');
    } else {
      setActiveCorrection(proposal);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 text-slate-100">
      {/* Header Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">Centralized Question Bank</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Browse, audit, auto-correct, and manage practice questions extracted from past practice documents
          </p>
        </div>

        <button
          onClick={handleSeedQuestions}
          disabled={seeding}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
          {seeding ? 'Seeding Questions...' : 'Import Sample Document Questions'}
        </button>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Subject Filter Pills */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSelectedSubjectId('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            selectedSubjectId === 'all'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Subjects ({questions.length})
        </button>
        {subjects.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setSelectedSubjectId(sub.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedSubjectId === sub.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* Questions List View */}
      {loading ? (
        <div className="p-12 text-center bg-slate-800/50 rounded-2xl border border-slate-700 text-slate-400 font-mono text-xs">
          Loading Question Bank repository...
        </div>
      ) : questions.length === 0 ? (
        <div className="p-12 text-center bg-slate-800/50 rounded-2xl border border-slate-700/80 space-y-3">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Questions Found</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Click the <strong className="text-emerald-400">"Import Sample Document Questions"</strong> button above to populate your database with questions extracted from your practice paper!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Q{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-300 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
                    Topic: {q.topic}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded uppercase mr-1">
                    {q.difficulty_level}
                  </span>

                  <button
                    onClick={() => handleRunAutoCorrect(q)}
                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    title="Run Auto-Correct Audit"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Auto-Correct
                  </button>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Render Question Text using MathText */}
              <div className="text-sm font-medium text-slate-100 leading-relaxed">
                <MathText text={q.question_text} />
              </div>

              {/* Question Image/Diagram */}
              {q.image_url && (
                <div className="my-2 p-2 bg-slate-950 border border-slate-800 rounded-lg max-w-sm">
                  <img
                    src={q.image_url}
                    alt="Question Diagram"
                    className="rounded max-h-48 object-contain mx-auto"
                  />
                </div>
              )}

              {/* Options rendered using MathText */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const optKey = `option_${opt.toLowerCase()}` as keyof Question;
                  const isCorrect = q.correct_answer === opt;
                  return (
                    <div
                      key={opt}
                      className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                        isCorrect
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-bold'
                          : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                          isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {opt}
                      </span>
                      <span>
                        <MathText text={String(q[optKey])} />
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation rendered using MathText */}
              {q.explanation && (
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/50 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                    Explanation:
                  </span>
                  <p>
                    <MathText text={q.explanation} />
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Render Auto-Correct Proposal Side-by-Side Modal */}
      {activeCorrection && (
        <AutoCorrectModal
          correction={activeCorrection}
          onClose={() => setActiveCorrection(null)}
          onApplied={() => loadData()}
        />
      )}
    </div>
  );
};