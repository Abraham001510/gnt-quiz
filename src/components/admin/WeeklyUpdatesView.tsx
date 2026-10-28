import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { seedQuestionBank } from '../../lib/seedQuestions';
import { MathText } from '../common/MathText';
import {
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  Plus,
  RefreshCw,
  Image,
  Database,
  Trash2,
  BookOpen,
} from 'lucide-react';

const ALL_JAMB_SUBJECTS = [
  'Use of English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Christian Religious Studies',
  'Government',
  'Economics',
  'Commerce',
  'Literature in English',
  'Principles of Accounts',
];

export const WeeklyUpdatesView: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('Use of English');
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State for Adding / Generating Questions
  const [showAddForm, setShowAddForm] = useState(false);
  const [subject, setSubject] = useState('Use of English');
  const [topic, setTopic] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadQuestions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setQuestions(data);
      }
    } catch (err) {
      console.error('Failed to load admin questions:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleSyncLocalBank = async () => {
    if (!confirm('Sync all 2,000+ local questions from FullQuestionBankData.ts to Supabase?')) {
      return;
    }

    setIsSyncing(true);
    setActionMsg('Uploading question bank chunks to Supabase...');

    const result = await seedQuestionBank();

    setIsSyncing(false);
    if (result.success) {
      setActionMsg(`Successfully uploaded ${result.count} questions into your database!`);
      loadQuestions();
      setTimeout(() => setActionMsg(null), 5000);
    } else {
      alert(`Seeding failed: ${result.error}`);
      setActionMsg(null);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (!error) {
        setActionMsg('Question deleted successfully.');
        loadQuestions();
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch (err) {
      alert('Failed to delete question.');
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !questionText || !optionA || !optionB || !optionC || !optionD) {
      alert('Please complete all required question fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject,
        topic,
        question_text: questionText,
        image_url: imageUrl.trim() || null,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_option: correctOption,
        correct_answer: correctOption,
        explanation,
      };

      const { error } = await supabase.from('questions').insert([payload]);

      if (!error) {
        setActionMsg(`New practice question for ${subject} added directly to Question Bank!`);
        setShowAddForm(false);
        setQuestionText('');
        setImageUrl('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setExplanation('');
        setTopic('');
        setSelectedSubject(subject);
        loadQuestions();
        setTimeout(() => setActionMsg(null), 4000);
      } else {
        alert(`Error inserting question: ${error.message}`);
      }
    } catch (err: any) {
      alert('Failed to save question.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter(
    (q) => (q.subject || '').trim().toLowerCase() === selectedSubject.trim().toLowerCase()
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 text-slate-100 py-4 font-sans">
      {/* Admin Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Centralized Question Bank Management</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Browse and manage questions across all 11 JAMB subjects with diagram & LaTeX support
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncLocalBank}
            disabled={isSyncing}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {isSyncing ? 'Syncing...' : 'Sync Full Question Bank to DB'}
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {showAddForm ? 'Close Form' : 'Add New Question'}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Add New Question Form Overlay / Panel */}
      {showAddForm && (
        <form
          onSubmit={handleCreateQuestion}
          className="bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl space-y-4 shadow-2xl"
        >
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Create & Publish UTME Practice Question
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
              >
                {ALL_JAMB_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Topic
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lexis and Structure, Old Testament History"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Question Text (Use &lt;u&gt;word&lt;/u&gt; for underline)
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter question text..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white outline-none"
            />
          </div>

          {/* Optional Diagram Link */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-emerald-400" /> Diagram / Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/diagram.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Option A</label>
              <input
                type="text"
                required
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Option B</label>
              <input
                type="text"
                required
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Option C</label>
              <input
                type="text"
                required
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Option D</label>
              <input
                type="text"
                required
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Correct Option
              </label>
              <select
                value={correctOption}
                onChange={(e) => setCorrectOption(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Explanation
              </label>
              <input
                type="text"
                placeholder="Explanation for students..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {submitting ? 'Saving Question...' : 'Publish to Active Question Bank'}
          </button>
        </form>
      )}

      {/* Main Inventory Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>Question Repository</span>
            <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-400">
              Total Database: {questions.length} Items
            </span>
          </h3>

          <button
            onClick={loadQuestions}
            className="p-1.5 text-slate-400 hover:text-white transition flex items-center gap-1 text-xs font-mono"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Repository
          </button>
        </div>

        {/* Complete 11 JAMB Subject Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          {ALL_JAMB_SUBJECTS.map((sub) => {
            const count = questions.filter(
              (q) => (q.subject || '').trim().toLowerCase() === sub.trim().toLowerCase()
            ).length;

            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                  selectedSubject === sub
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
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

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono">Loading repository...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono space-y-2">
            <p>No questions found under <strong>{selectedSubject}</strong>.</p>
            <p className="text-slate-500">
              Click <strong>Sync Full Question Bank to DB</strong> to load all 2,000+ past questions automatically from code.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3"
              >
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-emerald-400 font-bold">
                    #{idx + 1} • {q.topic || 'General Topic'}
                  </span>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm font-medium text-slate-200 leading-relaxed">
                  <MathText text={q.question_text || ''} />
                </div>

                {/* Render Diagram / Image Preview if URL is present */}
                {q.image_url && (
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg max-w-sm my-2">
                    <img
                      src={q.image_url}
                      alt="Question Diagram"
                      className="rounded max-h-48 object-contain mx-auto"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                  <div>A: <MathText text={q.option_a || ''} /></div>
                  <div>B: <MathText text={q.option_b || ''} /></div>
                  <div>C: <MathText text={q.option_c || ''} /></div>
                  <div>D: <MathText text={q.option_d || ''} /></div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold">
                    Correct: Option {q.correct_option || q.correct_answer}
                  </span>
                  {q.explanation && (
                    <span className="text-slate-500 text-[11px] truncate max-w-xs">
                      Exp: {q.explanation}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};