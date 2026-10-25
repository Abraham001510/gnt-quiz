import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Question, Subject } from '../../types/database.types';
import { getWeeklyUpdateStats, updateQuestionStatus, addGeneratedQuestion, WeeklyUpdateStats } from '../../lib/weeklyUpdateService';
import { Calendar, CheckCircle, XCircle, Clock, Sparkles, Plus, RefreshCw, Image } from 'lucide-react';

export const WeeklyUpdatesView: React.FC = () => {
  const [stats, setStats] = useState<WeeklyUpdateStats | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // Image / Diagram URL
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    const statsData = await getWeeklyUpdateStats();
    setStats(statsData);

    const { data: subData } = await supabase.from('subjects').select('*').order('name');
    setSubjects(subData || []);
    if (subData && subData.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subData[0].id);
    }

    const { data: qData } = await supabase
      .from('questions')
      .select('*')
      .eq('review_status', 'pending_review')
      .order('created_at', { ascending: false });

    setPendingQuestions(qData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    const success = await updateQuestionStatus(id, 'approved');
    if (success) {
      setActionMsg('Question approved and added to active question bank!');
      loadData();
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleReject = async (id: string) => {
    const success = await updateQuestionStatus(id, 'rejected');
    if (success) {
      setActionMsg('Question rejected.');
      loadData();
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !topic || !questionText || !optionA || !optionB || !optionC || !optionD) {
      alert('Please complete all question fields.');
      return;
    }

    setSubmitting(true);
    const success = await addGeneratedQuestion({
      subject_id: selectedSubjectId,
      topic,
      question_text: questionText,
      image_url: imageUrl.trim() || null,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_answer: correctAnswer,
      explanation,
      difficulty_level: difficulty,
      source_title: 'Weekly AI-Assisted Question Generator',
    });

    if (success) {
      setActionMsg('New JAMB practice question submitted to the Pending Review queue!');
      setShowAddForm(false);
      setQuestionText('');
      setImageUrl('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setExplanation('');
      setTopic('');
      loadData();
    } else {
      alert('Failed to submit question.');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">Weekly Question Updates & Review</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Review, approve, and generate weekly practice questions with diagram support
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> {showAddForm ? 'Close Question Form' : 'Generate New Practice Question'}
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
          <div><div className="text-[11px] font-semibold text-slate-400 uppercase">Active Questions</div><div className="text-xl font-bold text-white">{stats?.approvedQuestions || 0}</div></div>
        </div>
        <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg"><Clock className="w-5 h-5" /></div>
          <div><div className="text-[11px] font-semibold text-slate-400 uppercase">Pending Review</div><div className="text-xl font-bold text-white">{stats?.pendingQuestions || 0}</div></div>
        </div>
        <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg"><XCircle className="w-5 h-5" /></div>
          <div><div className="text-[11px] font-semibold text-slate-400 uppercase">Rejected</div><div className="text-xl font-bold text-white">{stats?.rejectedQuestions || 0}</div></div>
        </div>
        <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-lg"><Sparkles className="w-5 h-5" /></div>
          <div><div className="text-[11px] font-semibold text-slate-400 uppercase">Total Repository</div><div className="text-xl font-bold text-white">{stats?.totalQuestions || 0}</div></div>
        </div>
      </div>

      {/* Add Practice Question Form */}
      {showAddForm && (
        <form onSubmit={handleCreateQuestion} className="bg-slate-800 border border-emerald-500/30 p-6 rounded-2xl space-y-4 shadow-2xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-700">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Generate Practice Question with Image Support
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Subject</label>
              <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none">
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Topic</label>
              <input type="text" placeholder="e.g. Circuit Analysis" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Question Text</label>
            <textarea required rows={3} placeholder="Enter question text..." value={questionText} onChange={(e) => setQuestionText(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none" />
          </div>

          {/* Diagram / Image URL Input Field */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-emerald-400" /> Diagram / Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/diagram.png or upload image link"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Option A</label><input type="text" required value={optionA} onChange={(e) => setOptionA(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" /></div>
            <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Option B</label><input type="text" required value={optionB} onChange={(e) => setOptionB(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" /></div>
            <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Option C</label><input type="text" required value={optionC} onChange={(e) => setOptionC(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" /></div>
            <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Option D</label><input type="text" required value={optionD} onChange={(e) => setOptionD(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Correct Option</label>
              <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none">
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Explanation</label>
              <input type="text" placeholder="Explain why the correct answer is right..." value={explanation} onChange={(e) => setExplanation(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none" />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition">
            {submitting ? 'Submitting...' : 'Submit to Pending Review Queue'}
          </button>
        </form>
      )}

      {/* Pending Questions Review Queue */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700 flex items-center justify-between">
          <span>Pending Review Queue ({pendingQuestions.length})</span>
          <button onClick={loadData} className="text-slate-400 hover:text-white transition"><RefreshCw className="w-4 h-4" /></button>
        </h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono">Loading review queue...</div>
        ) : pendingQuestions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono">No questions awaiting review.</div>
        ) : (
          <div className="space-y-4">
            {pendingQuestions.map((q) => (
              <div key={q.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Topic: {q.topic}</span>
                  <span className="text-slate-400 text-[11px]">{q.source_title || 'Weekly Generator'}</span>
                </div>

                <p className="text-sm font-medium text-slate-200">{q.question_text}</p>

                {/* Render Diagram if present */}
                {q.image_url && (
                  <div className="my-2 p-2 bg-slate-950 border border-slate-800 rounded-lg max-w-sm">
                    <img src={q.image_url} alt="Question Diagram" className="rounded max-h-48 object-contain mx-auto" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>A: {q.option_a}</div>
                  <div>B: {q.option_b}</div>
                  <div>C: {q.option_c}</div>
                  <div>D: {q.option_d}</div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                  <span className="text-emerald-400 font-bold">Correct: {q.correct_answer}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleReject(q.id)} className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded text-xs font-semibold">Reject</button>
                    <button onClick={() => handleApprove(q.id)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold">Approve & Publish</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};