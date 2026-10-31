import { supabase } from './supabase';

export async function saveStudentAnswer(
  attemptId: string,
  questionId: string,
  selectedOption: 'A' | 'B' | 'C' | 'D'
) {
  try {
    const { error } = await supabase.from('student_answers').upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: selectedOption,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'attempt_id,question_id' }
    );
    if (error) console.error('Error saving student answer:', error);
  } catch (err) {
    console.error('Unexpected error in saveStudentAnswer:', err);
  }
}

export async function recordExamWarning(attemptId: string, currentWarnings: number) {
  try {
    await supabase
      .from('exam_attempts')
      .update({ warning_count: currentWarnings })
      .eq('id', attemptId);
  } catch (err) {
    console.error('Error recording warning count:', err);
  }
}

export async function authorizeStudentRetake(studentId: string) {
  try {
    // Un-finalize latest attempt or mark authorized
    const { error } = await supabase
      .from('exam_attempts')
      .update({ retake_authorized: true })
      .eq('student_id', studentId);
    return { success: !error, error: error?.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function finalizeAndGradeAttempt(
  attemptId: string,
  reason: string = 'manual_submit'
): Promise<{ success: boolean; rawScore: number; scaledScore: number; error?: string }> {
  try {
    // 1. Fetch student submitted answers for this attempt
    const { data: studentAnswers } = await supabase
      .from('student_answers')
      .select('question_id, selected_option')
      .eq('attempt_id', attemptId);

    // 2. Fetch questions bank to compare correct options
    const { data: questions } = await supabase
      .from('questions')
      .select('id, correct_option, correct_answer');

    let totalCorrect = 0;
    if (studentAnswers && questions) {
      const correctMap = new Map(
        questions.map((q) => [q.id, (q.correct_option || q.correct_answer || '').toUpperCase()])
      );
      studentAnswers.forEach((ans) => {
        if (correctMap.get(ans.question_id) === ans.selected_option.toUpperCase()) {
          totalCorrect++;
        }
      });
    }

    // Standard JAMB 400-Scale aggregate formula: (raw_correct / 180) * 400
    const scaledScore = parseFloat(((totalCorrect / 180) * 400).toFixed(2));
    const percentageScore = Math.round((totalCorrect / 180) * 100);

    // 3. Finalize record in Supabase
    const { error: updateError } = await supabase
      .from('exam_attempts')
      .update({
        is_finalized: true,
        submitted_at: new Date().toISOString(),
        submission_reason: reason,
        raw_score: totalCorrect,
        scaled_score: scaledScore,
        percentage_score: percentageScore,
      })
      .eq('id', attemptId);

    if (updateError) {
      console.warn('Fallback finalizing attempt:', updateError.message);
      await supabase
        .from('exam_attempts')
        .update({
          is_finalized: true,
          submitted_at: new Date().toISOString(),
          raw_score: totalCorrect,
          scaled_score: scaledScore,
        })
        .eq('id', attemptId);
    }

    return { success: true, rawScore: totalCorrect, scaledScore };
  } catch (err: any) {
    console.error('Finalize attempt error:', err);
    return { success: false, rawScore: 0, scaledScore: 0, error: err.message };
  }
}