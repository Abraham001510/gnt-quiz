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

export async function createFullJambAttempt(
  studentId: string,
  selectedSubjectIds: string[] // Must include Use of English + 3 other subjects
): Promise<{ success: boolean; attemptId?: string; error?: string }> {
  try {
    // 1. Fetch Full JAMB Configuration
    const { data: config, error: configErr } = await supabase
      .from('exam_configurations')
      .select('*')
      .eq('mode', 'full_jamb')
      .maybeSingle();

    if (configErr || !config) {
      throw new Error('Full JAMB Exam configuration not found in database.');
    }

    // 2. Set strict server deadline (120 minutes from now)
    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + config.duration_minutes * 60 * 1000);

    // 3. Create Exam Attempt Record
    const { data: attempt, error: attemptErr } = await supabase
      .from('exam_attempts')
      .insert([
        {
          student_id: studentId,
          config_id: config.id,
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

    if (attemptErr || !attempt) throw attemptErr;

    // 4. Fetch English Subject ID cleanly
    const { data: englishSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('code', 'ENG')
      .maybeSingle();

    // 5. Fetch Active Approved Questions for Selected Subjects
    const { data: allQuestions, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .in('subject_id', selectedSubjectIds)
      .eq('is_active', true)
      .eq('review_status', 'approved');

    if (qErr || !allQuestions) throw new Error('Failed to fetch questions for examination.');

    const englishQuestions = englishSubject
      ? allQuestions.filter((q) => q.subject_id === englishSubject.id)
      : [];
    const otherQuestions = englishSubject
      ? allQuestions.filter((q) => q.subject_id !== englishSubject.id)
      : allQuestions;

    const shuffle = <T>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

    const selectedExamQuestions: Question[] = [];

    // Select up to 60 English questions
    selectedExamQuestions.push(...shuffle(englishQuestions).slice(0, 60));

    // Select 40 questions for each of the other 3 selected subjects
    const otherSubjectIds = englishSubject
      ? selectedSubjectIds.filter((id) => id !== englishSubject.id)
      : selectedSubjectIds;

    otherSubjectIds.forEach((sId) => {
      const subQs = otherQuestions.filter((q) => q.subject_id === sId);
      selectedExamQuestions.push(...shuffle(subQs).slice(0, 40));
    });

    // 6. Insert Attempt Questions in fixed order
    const attemptQuestionsPayload = selectedExamQuestions.map((q, idx) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      question_order: idx + 1,
      subject_id: q.subject_id,
    }));

    const { error: insertAttemptQsErr } = await supabase
      .from('attempt_questions')
      .insert(attemptQuestionsPayload);

    if (insertAttemptQsErr) throw insertAttemptQsErr;

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
}