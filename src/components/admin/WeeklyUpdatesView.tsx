import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { authorizeStudentRetake } from '../../lib/examEngineService';
import { seedQuestionBank } from '../../lib/seedQuestions';
import { MathText } from '../common/MathText';
import {
  CheckCircle,
  Sparkles,
  Plus,
  RefreshCw,
  Image,
  Database,
  Trash2,
  Trophy,
  CheckCircle2,
  HelpCircle,
  Award,
  RotateCcw,
  Printer,
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
  const [activeTab, setActiveTab] = useState<'results' | 'questions'>('results');
  const [results, setResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('Use of English');
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State
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

  async function loadCandidateResults() {
    setLoadingResults(true);
    try {
      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (!attemptsData || attemptsData.length === 0) {
        setResults([]);
        setLoadingResults(false);
        return;
      }

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number');

      const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));

      const mergedResults = attemptsData.map((attempt) => {
        const raw = attempt.raw_score || 0;
        const scaled = attempt.scaled_score
          ? parseFloat(attempt.scaled_score)
          : parseFloat(((raw / 180) * 400).toFixed(2));

        return {
          ...attempt,
          raw_score: raw,
          scaled_score: scaled,
          profiles: profileMap.get(attempt.student_id) || {
            full_name: `Student (${attempt.student_id?.slice(0, 8)}...)`,
            email: 'Registered Candidate',
          },
        };
      });

      setResults(mergedResults);
    } catch (err) {
      console.error('Unexpected error loading candidate scores:', err);
    } finally {
      setLoadingResults(false);
    }
  }

  async function loadQuestions() {
    setLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  }

  useEffect(() => {
    loadCandidateResults();
    loadQuestions();
  }, []);

  const handleAuthorizeRetake = async (studentId: string, candidateName: string) => {
    if (!confirm(`Authorize examination retake for ${candidateName}?`)) return;

    const res = await authorizeStudentRetake(studentId);
    if (res.success) {
      setActionMsg(`Retake access granted for ${candidateName}.`);
      loadCandidateResults();
      setTimeout(() => setActionMsg(null), 4000);
    } else {
      alert(`Error authorizing retake: ${res.error}`);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleSyncLocalBank = async () => {
    if (!confirm('Sync full question bank to Supabase?')) return;
    setIsSyncing(true);
    setActionMsg('Syncing questions...');
    const result = await seedQuestionBank();
    setIsSyncing(false);
    if (result.success) {
      setActionMsg(`Uploaded ${result.count} questions!`);
      loadQuestions();
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Delete question?')) return;
    await supabase.from('questions').delete().eq('id', id);
    loadQuestions();
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
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
    await supabase.from('questions').insert([payload]);
    setSubmitting(false);
    setShowAddForm(false);
    loadQuestions();
  };

  const filteredQuestions = questions.filter(
    (q) => (q.subject || '').trim().toLowerCase() === selectedSubject.trim().toLowerCase()
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 text-slate-100 py-4 font-sans print:bg-white print:text-black">
      {/* Navigation Toolbar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-xl print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('results')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'results'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Candidate Results ({results.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'questions'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Question Bank ({questions.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'results' && (
            <button
              onClick={handlePrintPDF}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> PDF Report
            </button>
          )}
          <button
            onClick={activeTab === 'results' ? loadCandidateResults : loadQuestions}
            className="p-2 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loadingResults || loadingQuestions ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 print:hidden">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* RESULTS TAB */}
      {activeTab === 'results' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:pb-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> Candidate UTME Examination Submissions
              </h3>
              <p className="text-xs text-slate-400">
                Scores aggregate calculated strictly out of 400 points
              </p>
            </div>
          </div>

          {loadingResults ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading Candidate Records...</div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
                    <th className="p-4">Candidate Identity</th>
                    <th className="p-4">UTME Score (/400)</th>
                    <th className="p-4">Raw Correct</th>
                    <th className="p-4">Status / Reason</th>
                    <th className="p-4">Submitted At</th>
                    <th className="p-4 text-right print:hidden">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {results.map((r) => {
                    const candidateName = r.profiles?.full_name || `Student (${r.student_id?.slice(0, 8)})`;
                    return (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <span>{candidateName}</span>
                              <span className="block text-[10px] text-slate-500 font-mono">{r.profiles?.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-black text-emerald-400 text-base">
                          {r.scaled_score} / 400
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          {r.raw_score} / 180 Qs ({r.percentage_score || Math.round((r.raw_score / 180) * 100)}%)
                        </td>
                        <td className="p-4 font-mono text-[11px]">
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">
                            {r.submission_reason || 'manual_submit'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-[11px]">
                          {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'In Progress'}
                        </td>
                        <td className="p-4 text-right print:hidden">
                          <button
                            onClick={() => handleAuthorizeRetake(r.student_id, candidateName)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 ml-auto"
                            title="Reset student retake block"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset Retake
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QUESTION BANK TAB */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Question Repository Control
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncLocalBank}
                disabled={isSyncing}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2"
              >
                <Database className="w-4 h-4" /> {isSyncing ? 'Syncing...' : 'Sync Questions to DB'}
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> {showAddForm ? 'Close' : 'Add Question'}
              </button>
            </div>
          </div>

          {/* Subject Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
            {ALL_JAMB_SUBJECTS.map((sub) => {
              const count = questions.filter(
                (q) => (q.subject || '').trim().toLowerCase() === sub.trim().toLowerCase()
              ).length;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    selectedSubject === sub ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <span>{sub}</span>
                  <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded font-mono">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Question Inventory List */}
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredQuestions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-emerald-400 font-bold">#{idx + 1} - {q.topic || 'General Topic'}</span>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm font-medium text-slate-200">
                  <MathText text={q.question_text || ''} />
                </div>
                {q.image_url && (
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg max-w-sm">
                    <img src={q.image_url} alt="Question Diagram" className="rounded max-h-48 object-contain mx-auto" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                  <div>A: <MathText text={q.option_a || ''} /></div>
                  <div>B: <MathText text={q.option_b || ''} /></div>
                  <div>C: <MathText text={q.option_c || ''} /></div>
                  <div>D: <MathText text={q.option_d || ''} /></div>
                </div>
                <div className="pt-2 border-t border-slate-800 text-xs text-emerald-400 font-bold">
                  Correct Option: {q.correct_option || q.correct_answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};