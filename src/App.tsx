import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RegisterForm } from './components/auth/RegisterForm';
import { LoginForm } from './components/auth/LoginForm';
import { StudentProfileView } from './components/profile/StudentProfileView';
import { QuestionBankView } from './components/questions/QuestionBankView';
import { WeeklyUpdatesView } from './components/admin/WeeklyUpdatesView';
import { ExamLauncher } from './components/exam/ExamLauncher';
import { CbtExamView } from './components/exam/CbtExamView';
import { ExamResultsView } from './components/results/ExamResultsView';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { LogOut, User, Sparkles, Database, Calendar, Play, Trophy } from 'lucide-react';

function MainApp() {
  const { user, profile, loading, signOut } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [activeTab, setActiveTab] = useState<'profile' | 'question_bank' | 'weekly_updates' | 'take_exam' | 'leaderboard'>('profile');
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [viewResultAttemptId, setViewResultAttemptId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-mono text-sm">
        Initializing GNT Quiz Engine...
      </div>
    );
  }

  // Active Exam View
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

  // Exam Results View
  if (viewResultAttemptId) {
    return (
      <ExamResultsView
        attemptId={viewResultAttemptId}
        onBackToDashboard={() => {
          setViewResultAttemptId(null);
          setActiveTab('profile');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">
      {/* Top Navigation Bar */}
      <header className="bg-slate-800/80 border-b border-slate-700 sticky top-0 z-50 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-lg shadow-md shadow-emerald-600/30">
              G
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block leading-none">GNT QUIZ</span>
              <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">JAMB CBT Platform</span>
            </div>
          </div>

          {user && profile && (
            <div className="flex items-center gap-3">
              <nav className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 p-1 rounded-xl mr-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === 'profile' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('take_exam')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === 'take_exam' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" /> Take JAMB Exam
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === 'leaderboard' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" /> Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab('question_bank')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === 'question_bank' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" /> Question Bank
                </button>
                <button
                  onClick={() => setActiveTab('weekly_updates')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeTab === 'weekly_updates' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Weekly Updates
                </button>
              </nav>

              <button
                onClick={signOut}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-6">
        {user ? (
          activeTab === 'profile' ? (
            <StudentProfileView />
          ) : activeTab === 'take_exam' ? (
            <ExamLauncher onStartExam={(attemptId) => setActiveAttemptId(attemptId)} />
          ) : activeTab === 'leaderboard' ? (
            <LeaderboardView />
          ) : activeTab === 'question_bank' ? (
            <QuestionBankView />
          ) : (
            <WeeklyUpdatesView />
          )
        ) : (
          <div className="w-full flex flex-col items-center py-8">
            <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold uppercase border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Phase 7 Active: Automated Marking, Results & Leaderboard
            </div>

            {authMode === 'register' ? (
              <RegisterForm
                onSuccess={() => setAuthMode('login')}
                onToggleLogin={() => setAuthMode('login')}
              />
            ) : (
              <LoginForm
                onSuccess={() => {}}
                onToggleRegister={() => setAuthMode('register')}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;