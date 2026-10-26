import React from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { CbtExamView } from './components/exam/CbtExamView';
import { ExamLauncher } from './components/exam/ExamLauncher';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { StudentProfileView } from './components/profile/StudentProfileView';
import { ExamResultsView } from './components/results/ExamResultsView';
import { WeeklyUpdatesView } from './components/admin/WeeklyUpdatesView';
import { AutoCorrectModal } from './components/admin/AutoCorrectModal';
import { BookOpen, Trophy, User, ShieldAlert, LogOut, Sparkles } from 'lucide-react';

function ExamRoute() {
  const navigate = useNavigate();
  const [attemptId] = React.useState<string>(() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  });

  const handleFinalizeExam = () => {
    navigate('/results', { state: { attemptId } });
  };

  return (
    <CbtExamView
      attemptId={attemptId}
      onFinalizeExam={handleFinalizeExam}
    />
  );
}

function ResultsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const attemptId =
    (location.state as { attemptId?: string } | null)?.attemptId ?? 'latest';

  return (
    <ExamResultsView
      attemptId={attemptId}
      onBackToDashboard={() => navigate('/')}
    />
  );
}

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Whitelist your admin email address alongside standard metadata checks
  const isAdmin = 
    user?.user_metadata?.role === 'admin' || 
    user?.email === 'otunubiabraham@gmail.com';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Loading Examination Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">GNT QUIZ</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  JAMB 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                CBT Examination & Performance Portal
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                location.pathname === '/' 
                  ? 'bg-slate-800 text-emerald-400' 
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Exams</span>
            </Link>

            <Link
              to="/leaderboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                location.pathname === '/leaderboard' 
                  ? 'bg-slate-800 text-emerald-400' 
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden md:inline">Leaderboard</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  location.pathname === '/admin' 
                    ? 'bg-slate-800 text-amber-400' 
                    : 'text-amber-400/80 hover:text-amber-300 hover:bg-slate-800/50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden md:inline">Admin Portal</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-800">
                <Link
                  to="/profile"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    location.pathname === '/profile' 
                      ? 'bg-slate-800 text-emerald-400' 
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline">{user.email?.split('@')[0]}</span>
                </Link>

                <button
                  onClick={() => signOut()}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="ml-2 px-4 py-2 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route
            path="/"
            element={
              <ExamLauncher
                onStartExam={(subject) => navigate(`/exam/${subject}`)}
              />
            }
          />
          <Route path="/exam/:subject" element={<ExamRoute />} />
          <Route path="/results" element={<ResultsRoute />} />
          <Route path="/leaderboard" element={<LeaderboardView />} />
          
          <Route 
            path="/profile" 
            element={
              user ? <StudentProfileView /> : <Navigate to="/" replace />
            } 
          />

          <Route 
            path="/admin" 
            element={
              isAdmin ? (
                <WeeklyUpdatesView />
              ) : (
                <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
                  <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
                  <h2 className="text-xl font-bold text-slate-100">Access Restricted</h2>
                  <p className="text-slate-400 text-sm">
                    Administrative credentials are required to manage weekly question sets and updates.
                  </p>
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="px-4 py-2 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
                  >
                    Switch Account
                  </button>
                </div>
              )
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/40 border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>GNT Quiz Portal — Engineered for UTME Excellence</span>
          </div>
          <p>© 2026 GNT Education. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        {...({
          isOpen: isAuthOpen,
          onClose: () => setIsAuthOpen(false),
        } as any)}
      />
    </div>
  );
}