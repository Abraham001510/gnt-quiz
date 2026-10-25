import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, School, BookOpen, Award, Sparkles } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  fullName: string;
  university: string;
  course: string;
  score: number;
  submittedAt: string;
}

export const LeaderboardView: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      // Query top finalized exam attempts joined with student profile
      const { data } = await supabase
        .from('exam_attempts')
        .select('id, percentage_score, submitted_at, profiles(full_name, preferred_university, intended_course)')
        .eq('is_finalized', true)
        .order('percentage_score', { ascending: false })
        .limit(20);

      if (data) {
        const formatted: LeaderboardEntry[] = data.map((item: any) => ({
          id: item.id,
          fullName: item.profiles?.full_name || 'Anonymous Student',
          university: item.profiles?.preferred_university || 'N/A',
          course: item.profiles?.intended_course || 'N/A',
          score: item.percentage_score || 0,
          submittedAt: item.submitted_at,
        }));
        setLeaderboard(formatted);
      }
      setLoading(false);
    }

    loadLeaderboard();
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 text-slate-100">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-bold text-white">Platform Performance Leaderboard</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Top candidate scores ranked across all JAMB CBT examination simulations
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs bg-slate-800/50 rounded-2xl border border-slate-700">
          Loading candidate rankings...
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs bg-slate-800/50 rounded-2xl border border-slate-700">
          No finalized CBT attempt scores recorded yet. Complete an examination to claim top spot!
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((student, idx) => {
            const isTopThree = idx < 3;
            const badgeColor =
              idx === 0
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : idx === 1
                ? 'bg-slate-300 text-slate-950 border-slate-200'
                : idx === 2
                ? 'bg-amber-700 text-white border-amber-600'
                : 'bg-slate-800 text-slate-400 border-slate-700';

            return (
              <div
                key={student.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition ${
                  isTopThree
                    ? 'bg-slate-800/90 border-amber-500/40 shadow-lg'
                    : 'bg-slate-800/60 border-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl border font-black text-sm flex items-center justify-center shrink-0 ${badgeColor}`}>
                    #{idx + 1}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      {student.fullName}
                      {idx === 0 && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span className="flex items-center gap-1"><School className="w-3 h-3 text-emerald-400" /> {student.university}</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-emerald-400" /> {student.course}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-emerald-400">{student.score} <span className="text-xs text-slate-500 font-normal">/ 400</span></div>
                  <div className="text-[10px] text-slate-500 font-mono">Verified CBT Score</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};