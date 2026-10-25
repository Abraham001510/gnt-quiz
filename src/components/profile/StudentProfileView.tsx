import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, School, BookOpen, Phone, Mail, Award, Edit3, Save, CheckCircle, Loader2 } from 'lucide-react';

export const StudentProfileView: React.FC = () => {
  const { profile, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [preferredUniversity, setPreferredUniversity] = useState(profile?.preferred_university || '');
  const [intendedCourse, setIntendedCourse] = useState(profile?.intended_course || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">Loading your student dashboard...</p>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_university: preferredUniversity,
          intended_course: intendedCourse,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      setSuccessMsg('Profile details updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Profile Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 text-2xl font-bold uppercase shadow-inner">
            {profile.full_name ? profile.full_name.charAt(0) : 'S'}
          </div>

          <div className="text-center sm:text-left space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-extrabold text-white">{profile.full_name}</h2>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase rounded-full">
                Student Account
              </span>
            </div>
            <p className="text-slate-400 text-xs flex items-center justify-center sm:justify-start gap-3 pt-1">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {profile.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {profile.phone_number || 'N/A'}</span>
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 transition flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> Edit Preferences
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Details & Preferences Card */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-700">
          Academic Preferences
        </h3>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Preferred University
                </label>
                <input
                  type="text"
                  required
                  value={preferredUniversity}
                  onChange={(e) => setPreferredUniversity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Intended Course of Study
                </label>
                <input
                  type="text"
                  required
                  value={intendedCourse}
                  onChange={(e) => setIntendedCourse(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-start gap-3">
              <School className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Institution</div>
                <div className="text-base font-bold text-slate-100 mt-0.5">{profile.preferred_university}</div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Intended Major / Course</div>
                <div className="text-base font-bold text-slate-100 mt-0.5">{profile.intended_course}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Examination History Section */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" /> Completed Examinations History
          </h3>
        </div>

        <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-700/50">
          <p className="text-slate-400 text-sm">No exam history recorded yet.</p>
          <p className="text-slate-500 text-xs mt-1">Your scores and subject analysis will appear here after taking your first practice CBT test.</p>
        </div>
      </div>
    </div>
  );
};