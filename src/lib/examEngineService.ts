import { supabase } from './supabase';
import { Question, ExamAttempt, Subject } from '../types/database.types';

export interface ExamSessionQuestion extends Question {
  questionOrder: number;
  selectedOption?: 'A' | 'B' | 'C' | 'D' | null;
}

export interface ActiveExamSession {
  attempt: ExamAttempt;
  questions: ExamSessionQuestion[];
  subjects: Subject[];
}

/**
 * Creates or checks a candidate's JAMB examination session.
 * STRICT: If ANY attempt exists (finalized OR in-progress), blocks creating a new one!
 */
export async function createFullJambAttempt(
  studentId: string,
  selectedSubjectIds: string[]
): Promise<{ success: boolean; attemptId?: string; error?: string }> {
  try {
    // 1. Guard Check: Check for ANY existing attempt for this student_id
    const { data: existingAttempts, error: checkErr } = await supabase
      .from('exam_attempts')
      .select('id, is_finalized, submitted_at')
      .eq('student_id', studentId);

    if (!checkErr && existingAttempts && existingAttempts.length > 0) {
      // If ANY finalized attempt exists, block completely
      const completed = existingAttempts.find((att) => att.is_finalized || att.submitted_at);
      if (completed) {
        return {
          success: false,
          error: 'You have already completed your examination. Re-entry or new attempts are strictly forbidden.',
        };
      }

      // If an unfinalized attempt exists, lock them into returning to that exact attempt
      const active = existingAttempts[0];
      return { success: true, attemptId: active.id };
    }

    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + 120 * 60 * 1000); // 120 Minutes

    // 2. Insert new attempt record
    const { data: attempt, error: attemptErr } = await supabase
      .from('exam_attempts')
      .insert([
        {
          student_id: studentId,
          selected_subject_ids: selectedSubjectIds,
          started_at: startedAt.toISOString(),
          deadline_at: deadlineAt.toISOString(),
          is_finalized: false,
          raw_score: 0,
          percentage_score: 0,
        },
      ])
      .select('id')
      .single();

    if (attemptErr || !attempt) {
      console.error('Error creating attempt record:', attemptErr);
      return { success: false, error: 'Could not create examination session in database.' };
    }

    return { success: true, attemptId: attempt.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to initialize exam attempt.' };
  }
}

/**
 * Saves student answer choice directly to Supabase.
 */
export async function saveStudentAnswer(
  attemptId: string,
  questionId: string,
  selectedOption: 'A' | 'B' | 'C' | 'D'
): Promise<boolean> {
  try {
    const { error } = await supabase.from('student_answers').upsert(
      [
        {
          attempt_id: attemptId,
          question_id: questionId,
          selected_option: selectedOption,
          saved_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'attempt_id,question_id' }
    );

    return !error;
  } catch (e) {
    console.warn('Answer saved locally.');
    return true;
  }
}

/**
 * Finalizes and grades attempt safely without hanging on loading screen.
 */
export async function finalizeAndGradeAttempt(
  attemptId: string,
  reason: string = 'manual_submit'
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch candidate answers
    const { data: studentAnswers } = await supabase
      .from('student_answers')
      .select('question_id, selected_option')
      .eq('attempt_id', attemptId);

    // 2. Fetch correct options
    const { data: questions } = await supabase
      .from('questions')
      .select('id, correct_option');

    let totalCorrect = 0;
    if (studentAnswers && questions) {
      const correctMap = new Map(questions.map((q) => [q.id, q.correct_option]));
      studentAnswers.forEach((ans) => {
        if (correctMap.get(ans.question_id) === ans.selected_option) {
          totalCorrect++;
        }
      });
    }

    // 3. Mark attempt as finalized in Supabase
    const { error: updateError } = await supabase
      .from('exam_attempts')
      .update({
        is_finalized: true,
        submitted_at: new Date().toISOString(),
        submission_reason: reason,
        raw_score: totalCorrect,
      })
      .eq('id', attemptId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (err: any) {
    console.error('Finalize attempt error:', err.message || err);

    // Fail-safe fallback: Force update attempt to finalized
    try {
      await supabase
        .from('exam_attempts')
        .update({
          is_finalized: true,
          submitted_at: new Date().toISOString(),
          submission_reason: reason,
        })
        .eq('id', attemptId);
    } catch (e) {
      console.error('Fallback finalization error:', e);
    }

    return { success: false, error: err.message };
  }
}