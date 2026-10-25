import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ProposedCorrection } from '../../lib/autoCorrectService';
import { MathText } from '../common/MathText';
import { Sparkles, Check, X, AlertTriangle } from 'lucide-react';

interface AutoCorrectModalProps {
  correction: ProposedCorrection;
  onClose: () => void;
  onApplied: () => void;
}

export const AutoCorrectModal: React.FC<AutoCorrectModalProps> = ({ correction, onClose, onApplied }) => {
  const [applying, setApplying] = useState(false);

  const handleApproveCorrection = async () => {
    setApplying(true);
    const { error } = await supabase
      .from('questions')
      .update({
        question_text: correction.proposed.question_text,
        option_a: correction.proposed.option_a,
        option_b: correction.proposed.option_b,
        option_c: correction.proposed.option_c,
        option_d: correction.proposed.option_d,
        correct_answer: correction.proposed.correct_answer,
        explanation: correction.proposed.explanation,
        updated_at: new Date().toISOString(),
      })
      .eq('id', correction.questionId);

    if (error) {
      alert(`Failed to apply correction: ${error.message}`);
    } else {
      alert('Correction approved and question successfully updated in database!');
      onApplied();
      onClose();
    }
    setApplying(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Auto-Correct Audit & Proposal</h3>
              <p className="text-xs text-slate-400">Review proposed mathematical & syntax corrections before saving</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Detected Issues Banner */}
        <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-amber-200">
          <div className="font-bold flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" /> Detected Audited Issues:
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            {correction.detectedIssues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          {/* Original Version */}
          <div className="bg-slate-950 border border-rose-500/30 rounded-xl p-4 space-y-3">
            <span className="font-bold text-rose-400 uppercase tracking-wider block border-b border-slate-800 pb-2">
              Original Question
            </span>
            <div className="text-slate-200 font-medium">
              <MathText text={correction.original.question_text} />
            </div>
            <div className="space-y-1.5 font-mono text-slate-300">
              <div>A: <MathText text={correction.original.option_a} /></div>
              <div>B: <MathText text={correction.original.option_b} /></div>
              <div>C: <MathText text={correction.original.option_c} /></div>
              <div>D: <MathText text={correction.original.option_d} /></div>
            </div>
            <div className="text-emerald-400 font-bold">Answer: Option {correction.original.correct_answer}</div>
            <div className="text-slate-400">
              Explanation: <MathText text={correction.original.explanation || 'None'} />
            </div>
          </div>

          {/* Proposed Correction Version */}
          <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-3">
            <span className="font-bold text-emerald-400 uppercase tracking-wider block border-b border-slate-800 pb-2">
              Proposed Auto-Correction
            </span>
            <div className="text-slate-100 font-medium">
              <MathText text={correction.proposed.question_text} />
            </div>
            <div className="space-y-1.5 font-mono text-slate-200">
              <div>A: <MathText text={correction.proposed.option_a} /></div>
              <div>B: <MathText text={correction.proposed.option_b} /></div>
              <div>C: <MathText text={correction.proposed.option_c} /></div>
              <div>D: <MathText text={correction.proposed.option_d} /></div>
            </div>
            <div className="text-emerald-400 font-bold">Answer: Option {correction.proposed.correct_answer}</div>
            <div className="text-slate-300">
              Explanation: <MathText text={correction.proposed.explanation} />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Reject Correction
          </button>
          <button
            onClick={handleApproveCorrection}
            disabled={applying}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> {applying ? 'Applying...' : 'Approve & Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};