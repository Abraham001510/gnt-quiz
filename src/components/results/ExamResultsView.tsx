import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Award, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ExamResultsViewProps {
  attemptId: string;
  onBackToDashboard: () => void;
}

export const ExamResultsView: React.FC<ExamResultsViewProps> = ({ attemptId, onBackToDashboard }) => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      try {
        setLoading(true);
        let query = supabase.from('exam_attempts').select('*');

        if (attemptId === 'latest') {
          query = query.eq('is_finalized', true).order('submitted_at', { ascending: false }).limit(1);
        } else {
          query = query.eq('id', attemptId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const attempt = data[0];
          const raw = attempt.raw_score || 0;
          const scaled = attempt.scaled_score
            ? parseFloat(attempt.scaled_score)
            : parseFloat(((raw / 180) * 400).toFixed(2));

          setResult({
            ...attempt,
            raw_score: raw,
            scaled_score: scaled,
            percentage: Math.round((raw / 180) * 100),
          });
        }
      } catch (err) {
        console.error('Error loading result:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-mono text-sm">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-400">Loading Examination Performance Summary...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <Award className="w-8 h-8"/>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white">UTME Performance Report</h2>
          <p className="text-xs text-slate-400 font-mono">Exam Ref: #{result?.id?.slice(0, 8)}</p>
        </div>

        {/* Aggregated Score Badge Matching Reference UI[cite: 9] */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
            Official Aggregate UTME Score
          </span>
          <div className="text-5xl font-black text-emerald-400 tracking-tight">
            {result?.scaled_score || '0.00'}{' '}
            <span className="text-2xl font-bold text-slate-400">/ 400</span>
          </div>
          <div className="text-xs font-mono text-slate-400 pt-2 flex items-center justify-center gap-2 border-t border-slate-900">
            <span>{result?.percentage}%</span>
            <span>·</span>
            <span>{result?.raw_score} / 180 CORRECT QUESTIONS</span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-400 text-left bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-mono">
          <div className="flex justify-between">
            <span>Submission Type:</span>
            <span className="text-white font-bold">{result?.submission_reason || 'manual_submit'}</span>
          </div>
          <div className="flex justify-between">
            <span>Date Finalized:</span>
            <span className="text-white font-bold">
              {result?.submitted_at ? new Date(result.submitted_at).toLocaleString() : 'Just now'}
            </span>
          </div>
        </div>

        <button
          onClick={onBackToDashboard}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <ArrowLeft className="w-4 h-4"/> Back to Dashboard
        </button>
      </div>
    </div>
  );
};