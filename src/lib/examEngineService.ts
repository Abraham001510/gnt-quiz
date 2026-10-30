import { supabase } from './supabase';
import { Question, ExamAttempt, Subject } from '../types/database.types';

export interface ExamSessionQuestion extends Question {
  questionOrder: number;
  selectedOption?: 'A' | 'B' | 'C' | 'D' | null;
}

export async function createFullJambAttempt(
  studentId: string,
  selectedSubjectIds: string[]
): Promise<{ success: boolean; attemptId?: string; error?: string }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const validStudentId = authData?.user?.id || studentId;

    // 1. Guard Check: Resume or block existing attempts
    const { data: existingAttempts } = await supabase
      .from('exam_attempts')
      .select('id, is_finalized, submitted_at')
      .eq('student_id', validStudentId);

    if (existingAttempts && existingAttempts.length > 0) {
      const attempt = existingAttempts[0];
      if (attempt.is_finalized || attempt.submitted_at) {
        return {
          success: false,
          error: 'You have already completed your examination attempt.',
        };
      }
      return { success: true, attemptId: attempt.id };
    }

    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + 120 * 60 * 1000);

    // 2. Insert attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from('exam_attempts')
      .insert([
        {
          student_id: validStudentId,
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
      return {
        success: false,
        error: `Could not create session: ${attemptErr?.message || 'Database error'}`,
      };
    }

    return { success: true, attemptId: attempt.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to initialize exam attempt.' };
  }
}

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
    return true;
  }
}

export async function finalizeAndGradeAttempt(
  attemptId: string,
  reason: string = 'manual_submit'
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch student submitted answers
    const { data: studentAnswers } = await supabase
      .from('student_answers')
      .select('question_id, selected_option')
      .eq('attempt_id', attemptId);

    // 2. Fetch correct options for grading
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

    const percentageScore = Math.round((totalCorrect / 180) * 100);

    // 3. Mark attempt as finalized in Supabase
    const { error: updateError } = await supabase
      .from('exam_attempts')
      .update({
        is_finalized: true,
        submitted_at: new Date().toISOString(),
        submission_reason: reason,
        raw_score: totalCorrect,
        percentage_score: percentageScore,
      })
      .eq('id', attemptId);

    if (updateError) {
      console.error('Update error on finalize:', updateError);
      // Fallback update
      await supabase
        .from('exam_attempts')
        .update({ is_finalized: true, submitted_at: new Date().toISOString() })
        .eq('id', attemptId);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Finalize attempt error:', err);
    return { success: false, error: err.message };
  }
}