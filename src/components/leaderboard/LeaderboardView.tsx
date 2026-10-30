import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, Medal, RefreshCw, UserCheck, CheckCircle2 } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch all finalized exam attempts sorted by raw_score
      const { data: attemptsData, error: attemptErr } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('is_finalized', true)
        .order('raw_score', { ascending: false });

      if (attemptErr) {
        console.error('Leaderboard attempt fetch error:', attemptErr);
        setLoading(false);
        return;
      }

      if (!attemptsData || attemptsData.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // 2. Fetch all profiles to map names safely
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email, preferred_university, intended_course');

      const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));

      // 3. Deduplicate attempts: keep the highest score per candidate
      const candidateHighestMap = new Map<string, any>();

      attemptsData.forEach((attempt) => {
        const studentId = attempt.student_id;
        const profile = profileMap.get(studentId);
        
        const candidateName =
          profile?.full_name && profile.full_name !== 'Registered Student'
            ? profile.full_name
            : profile?.email || `Candidate (${studentId?.slice(0, 8)})`;

        const existing = candidateHighestMap.get(studentId);
        if (!existing || (attempt.raw_score || 0) > (existing.raw_score || 0)) {
          candidateHighestMap.set(studentId, {
            ...attempt,
            candidateName,
            email: profile?.email || 'Registered Candidate',
            university: profile?.preferred_university || 'UTME Candidate',
            course: profile?.intended_course || 'General UTME',
          });
        }
      });

      const sortedLeaderboard = Array.from(candidateHighestMap.values()).sort(
        (a, b) => (b.raw_score || 0) - (a.raw_score || 0)
      );

      setLeaderboard(sortedLeaderboard);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-100 py-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" /> Platform Performance Leaderboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Top candidate scores ranked across all UTME CBT examination simulations
          </p>
        </div>

        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Leaderboard
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs space-y-2">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Computing candidate ranks...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
          <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Finalized Attempts Recorded Yet</h3>
          <p className="text-xs text-slate-500">
            Complete a CBT examination to claim top spot on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                <th className="p-4 w-16 text-center">Rank</th>
                <th className="p-4">Candidate</th>
                <th className="p-4">Target Institution & Course</th>
                <th className="p-4 text-right">UTME Score</th>
                <th className="p-4 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {leaderboard.map((item, index) => {
                const rank = index + 1;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-4 text-center font-bold text-sm">
                      {rank === 1 ? (
                        <span className="text-amber-400 flex items-center justify-center gap-1 font-extrabold">
                          <Medal className="w-5 h-5" /> #1
                        </span>
                      ) : rank === 2 ? (
                        <span className="text-slate-300 flex items-center justify-center gap-1 font-bold">
                          <Medal className="w-4 h-4 text-slate-300" /> #2
                        </span>
                      ) : rank === 3 ? (
                        <span className="text-amber-600 flex items-center justify-center gap-1 font-bold">
                          <Medal className="w-4 h-4 text-amber-600" /> #3
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">#{rank}</span>
                      )}
                    </td>

                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="block text-slate-100">{item.candidateName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{item.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-300">
                      <span className="block text-slate-200 font-medium">{item.university}</span>
                      <span className="text-[11px] text-slate-400">{item.course}</span>
                    </td>

                    <td className="p-4 text-right font-mono font-extrabold text-emerald-400 text-sm">
                      {item.raw_score !== null ? `${item.raw_score} / 180` : 'N/A'}
                    </td>

                    <td className="p-4 text-right font-mono text-slate-300">
                      {item.percentage_score ? `${item.percentage_score}%` : `${Math.round(((item.raw_score || 0) / 180) * 100)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};