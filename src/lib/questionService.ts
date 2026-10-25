import { supabase } from './supabase';
import { Question } from '../types/database.types';

export async function getQuestionsBySubject(subjectId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('is_active', true)
    .eq('review_status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subject questions:', error.message);
    return [];
  }

  return data || [];
}

export async function getQuestionCountsBySubject(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('questions')
    .select('subject_id')
    .eq('is_active', true)
    .eq('review_status', 'approved');

  if (error) {
    console.error('Error fetching question counts:', error.message);
    return {};
  }

  const counts: Record<string, number> = {};
  data?.forEach((q) => {
    counts[q.subject_id] = (counts[q.subject_id] || 0) + 1;
  });

  return counts;
}

// Soft delete / Deactivate a published question
export async function archiveQuestion(questionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', questionId);

  if (error) {
    console.error('Error archiving question:', error.message);
    return false;
  }
  return true;
}

// Hard delete a question permanently from the database
export async function deleteQuestionPermanently(questionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    console.error('Error deleting question:', error.message);
    return false;
  }
  return true;
}