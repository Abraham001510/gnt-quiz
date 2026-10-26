import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { StudentProfileView } from './components/profile/StudentProfileView';
import { CbtExamView } from './components/exam/CbtExamView';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { QuestionBankView } from './components/questions/QuestionBankView';
import { ExamResultsView } from './components/results/ExamResultsView';
import {
  User,
  TrendingUp,
  Play,
  Target,
  Trophy,
  Database,
  Bell,
  LogOut,
  Sparkles,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';

const AnalyticsView: React.FC = () => (
  <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
    <h2 className="text-xl font-bold text-white">Analytics</h2>
    <p className="mt-2 text-sm text-slate-400">
      Analytics are not available yet. Complete practice exams to track your performance.
    </p>
  </section>
);

const WeeklyUpdatesView: React.FC = () => (
  <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
    <h2 className="text-xl font-bold text-white">Weekly Updates</h2>
    <p className="mt-2 text-sm text-slate-400">
      Weekly updates are not available yet. Check back soon for announcements.
    </p>
  </section>
);

export const App: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'profile' | 'analytics' | 'subject_practice' | 'leaderboard' | 'question_bank' | 'weekly_updates'
  >('profile');
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [viewResultAttemptId, setViewResultAttemptId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-2xl">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading GNT Quiz Engine...</span>
        </div>
      </div>
    );
  }

  // Render Fullscreen CBT Examination Workspace if exam is in progress
  if (activeAttemptId) {
    return (
      <CbtExamView
        attemptId={activeAttemptId}
        onFinalizeExam={() => {
          setViewResultAttemptId(activeAttemptId);
          setActiveAttemptId(null);
        }}
      />
    );
  }

  // Render Exam Diagnostic Results View
  if (viewResultAttemptId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
        <ExamResultsView
          attemptId={viewResultAttemptId}
          onBackToDashboard={() => setViewResultAttemptId(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Professional Navigation Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-xl flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
                G
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-white">GNT QUIZ</h1>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                    JAMB CBT 2026
                  </span>
                </div>
                <p className="text-slate-400 text-xs hidden sm:block">
                  Verified CBT Exam Pipeline & Performance Diagnostic Portal
                </p>
              </div>
            </div>

            {user && (
              <button
                onClick={() => signOut()}
                className="md:hidden p-2 text-slate-400 hover:text-rose-400 bg-slate-800 rounded-xl transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* User Nav Controls */}
          {user ? (
            <div className="flex flex-wrap items-center gap-2">
              <nav className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'profile'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" /> Dashboard
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'analytics'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" /> Analytics
                </button>

                <button
                  onClick={() => setActiveTab('subject_practice')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'subject_practice'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Target className="w-4 h-4" /> Practice Drills
                </button>

                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'leaderboard'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Trophy className="w-4 h-4" /> Leaderboard
                </button>

                <button
                  onClick={() => setActiveTab('question_bank')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'question_bank'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Database className="w-4 h-4" /> Question Bank
                </button>

                <button
                  onClick={() => setActiveTab('weekly_updates')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'weekly_updates'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Bell className="w-4 h-4" /> Updates
                </button>
              </nav>

              <button
                onClick={() => signOut()}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 rounded-xl transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* Main Application Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {!user ? (
          <div className="max-w-4xl mx-auto py-12 space-y-12">
            {/* Hero Section for Unauthenticated Visitors */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Next-Gen Nigerian CBT Preparation Platform
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
                Master Your JAMB Exam with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Precision & Speed</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Practice with 460+ past questions, crisp KaTeX mathematical rendering, realistic 180-question timed exam simulations, and instant diagnostic score reports.
              </p>
            </div>

            {/* Auth Card Container */}
            <AuthModal />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Bar: Quick Launch Full Exam */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

              <div className="space-y-2 text-center sm:text-left z-10">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4" /> Target Institution: UTME 2026
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Ready for a Full 4-Subject Simulation?</h2>
                <p className="text-slate-400 text-xs max-w-xl">
                  Simulate the exact 180-question JAMB UTME exam layout under standard 120-minute timed conditions.
                </p>
              </div>

              <button
                onClick={async () => {
                  // Quick trigger standard exam configuration
                  const { data: config } = await import('./lib/supabase').then((m) =>
                    m.supabase.from('exam_configurations').select('*').eq('mode', 'standard_jamb').single()
                  );
                  if (config) {
                    const startedAt = new Date();
                    const deadlineAt = new Date(startedAt.getTime() + 120 * 60 * 1000);
                    const { data: attempt } = await import('./lib/supabase').then((m) =>
                      m.supabase
                        .from('exam_attempts')
                        .insert([
                          {
                            student_id: user.id,
                            config_id: config.id,
                            started_at: startedAt.toISOString(),
                            deadline_at: deadlineAt.toISOString(),
                            is_finalized: false,
                            raw_score: 0,
                            percentage_score: 0,
                          },
                        ])
                        .select('id')
                        .single()
                    );
                    if (attempt) setActiveAttemptId(attempt.id);
                  }
                }}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-3 shrink-0 z-10 group"
              >
                <Play className="w-5 h-5 fill-current" /> Start Full JAMB Simulation <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* View Router */}
            {activeTab === 'profile' && <StudentProfileView />}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'subject_practice' && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-bold text-white">Practice Drills</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Subject practice is currently unavailable. Please use the full JAMB simulation instead.
                </p>
              </section>
            )}
            {activeTab === 'leaderboard' && <LeaderboardView />}
            {activeTab === 'question_bank' && <QuestionBankView />}
            {activeTab === 'weekly_updates' && <WeeklyUpdatesView />}
          </div>
        )}
      </main>
    </div>
  );
};