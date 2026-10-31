import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, RefreshCw, Printer, CheckCircle2 } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('is_finalized', true)
        .order('raw_score', { ascending: false });

      if (!attemptsData || attemptsData.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email, preferred_university, intended_course');

      const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));
      const candidateHighestMap = new Map<string, any>();

      attemptsData.forEach((attempt) => {
        const studentId = attempt.student_id;
        const profile = profileMap.get(studentId);

        const candidateName =
          profile?.full_name && profile.full_name !== 'Registered Student'
            ? profile.full_name
            : profile?.email || `Candidate (${studentId?.slice(0, 8)})`;

        const raw = attempt.raw_score || 0;
        const scaled = attempt.scaled_score
          ? parseFloat(attempt.scaled_score)
          : parseFloat(((raw / 180) * 400).toFixed(2));
        const percentage = Math.round((raw / 180) * 100);

        const existing = candidateHighestMap.get(studentId);
        if (!existing || raw > (existing.raw_score || 0)) {
          candidateHighestMap.set(studentId, {
            ...attempt,
            raw_score: raw,
            scaled_score: scaled,
            percentage_score: percentage,
            candidateName,
            email: profile?.email || 'Registered Candidate',
            university: profile?.preferred_university || 'Federal University of Technology, Minna',
            course: profile?.intended_course || 'Computer Engineering',
          });
        }
      });

      const sorted = Array.from(candidateHighestMap.values()).sort(
        (a, b) => b.scaled_score - a.scaled_score
      );

      setLeaderboard(sorted);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleDownloadPDF = () => {
    window.print();
  };

  const topCandidate = leaderboard[0];
  const runnerUp1 = leaderboard[1];
  const runnerUp2 = leaderboard[2];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-100 py-4 font-sans print:bg-white print:text-black">
      {/* Action Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" /> Platform UTME Leaderboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Top candidate scores aggregate calculated strictly out of 400 points
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Download PDF Report
          </button>
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading Rankings...</div>
      ) : leaderboard.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
          No finalized scores found yet.
        </div>
      ) : (
        <>
          {/* Top Candidates Banner Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block">
            {topCandidate && (
              <div className="md:col-span-2 bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
                <span className="inline-block px-4 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-mono font-bold uppercase tracking-widest">
                  #1 · TOP CANDIDATE
                </span>
                <div>
                  <h3 className="text-2xl font-black text-white">{topCandidate.candidateName}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {topCandidate.university} · {topCandidate.course}
                  </p>
                </div>

                <div className="py-2">
                  <div className="text-5xl font-black text-emerald-400 tracking-tight">
                    {topCandidate.scaled_score} <span className="text-2xl font-bold text-slate-400">/ 400</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-2 flex items-center justify-center gap-2">
                    <span>{topCandidate.percentage_score}%</span>
                    <span>·</span>
                    <span>{topCandidate.raw_score} / 180 CORRECT</span>
                  </div>
                </div>
              </div>
            )}

            {runnerUp1 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-xl">
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-300 mx-auto border border-slate-700">
                  🥈 #2
                </div>
                <h4 className="text-lg font-bold text-white">{runnerUp1.candidateName}</h4>
                <p className="text-[11px] text-slate-400">
                  {runnerUp1.university} · {runnerUp1.course}
                </p>
                <div className="text-3xl font-black text-emerald-400">
                  {runnerUp1.scaled_score} <span className="text-sm font-normal text-slate-400">/ 400</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {runnerUp1.percentage_score}% · {runnerUp1.raw_score} / 180 CORRECT
                </div>
              </div>
            )}

            {runnerUp2 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-xl">
                <div className="w-8 h-8 bg-amber-950 rounded-full flex items-center justify-center text-xs font-bold text-amber-500 mx-auto border border-amber-800">
                  🥉 #3
                </div>
                <h4 className="text-lg font-bold text-white">{runnerUp2.candidateName}</h4>
                <p className="text-[11px] text-slate-400">
                  {runnerUp2.university} · {runnerUp2.course}
                </p>
                <div className="text-3xl font-black text-emerald-400">
                  {runnerUp2.scaled_score} <span className="text-sm font-normal text-slate-400">/ 400</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {runnerUp2.percentage_score}% · {runnerUp2.raw_score} / 180 CORRECT
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl mt-6">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 w-16 text-center">Rank</th>
                  <th className="p-4">Candidate Identity</th>
                  <th className="p-4">Target University & Course</th>
                  <th className="p-4 text-right">Raw Correct</th>
                  <th className="p-4 text-right">UTME Score (/400)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {leaderboard.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-4 text-center font-bold font-mono">#{idx + 1}</td>
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span>{item.candidateName}</span>
                          <span className="block text-[10px] text-slate-500 font-mono">{item.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <span>{item.university}</span>
                      <span className="block text-[10px] text-slate-500">{item.course}</span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-300">
                      {item.raw_score} / 180
                    </td>
                    <td className="p-4 text-right font-mono font-black text-emerald-400 text-sm">
                      {item.scaled_score} / 400
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};