import { supabase } from './supabase';
import { Question } from '../types/database.types';

export interface WeeklyUpdateStats {
  totalQuestions: number;
  approvedQuestions: number;
  pendingQuestions: number;
  rejectedQuestions: number;
  questionsBySubject: Record<string, number>;
}

export async function getWeeklyUpdateStats(): Promise<WeeklyUpdateStats> {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, subject_id, review_status');

  if (error) {
    console.error('Error fetching weekly update stats:', error.message);
    return {
      totalQuestions: 0,
      approvedQuestions: 0,
      pendingQuestions: 0,
      rejectedQuestions: 0,
      questionsBySubject: {},
    };
  }

  const stats: WeeklyUpdateStats = {
    totalQuestions: questions.length,
    approvedQuestions: 0,
    pendingQuestions: 0,
    rejectedQuestions: 0,
    questionsBySubject: {},
  };

  questions.forEach((q) => {
    if (q.review_status === 'approved') stats.approvedQuestions++;
    if (q.review_status === 'pending_review') stats.pendingQuestions++;
    if (q.review_status === 'rejected') stats.rejectedQuestions++;

    stats.questionsBySubject[q.subject_id] = (stats.questionsBySubject[q.subject_id] || 0) + 1;
  });

  return stats;
}

export async function updateQuestionStatus(
  questionId: string,
  status: 'approved' | 'rejected'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('questions')
      .update({
        review_status: status,
        is_active: status === 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId);

    if (error) {
      console.error('Error updating question status:', error.message);
      alert(`Update failed: ${error.message}`);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('Unexpected status update error:', err);
    return false;
  }
}

export async function addGeneratedQuestion(questionData: {
  subject_id: string;
  topic: string;
  question_text: string;
  image_url?: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  source_title: string;
}): Promise<boolean> {
  const { error } = await supabase.from('questions').insert([
    {
      subject_id: questionData.subject_id,
      topic: questionData.topic,
      question_text: questionData.question_text,
      image_url: questionData.image_url || null,
      option_a: questionData.option_a,
      option_b: questionData.option_b,
      option_c: questionData.option_c,
      option_d: questionData.option_d,
      correct_answer: questionData.correct_answer,
      explanation: questionData.explanation,
      difficulty_level: questionData.difficulty_level,
      source_classification: 'original_jamb_style',
      source_title: questionData.source_title,
      review_status: 'pending_review',
      is_active: false,
    },
  ]);

  if (error) {
    console.error('Error adding generated question:', error.message);
    return false;
  }

  return true;
}