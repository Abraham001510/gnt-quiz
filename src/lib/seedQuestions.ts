import { supabase } from './supabase';
import { fullDocumentQuestions } from './fullQuestionBankData';

export interface RawQuestionInput {
  subjectCode: string;
  topic: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  examYear?: number;
}

export async function seedQuestionBank(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // 1. Fetch active subject IDs from database
    const { data: subjects, error: subError } = await supabase
      .from('subjects')
      .select('id, code');
      
    if (subError) throw subError;

    const subjectMap = new Map<string, string>();
    subjects?.forEach((s) => subjectMap.set(s.code, s.id));

    // 2. Format all extracted document questions
    const formattedQuestions = fullDocumentQuestions.map((q) => {
      const subjectId = subjectMap.get(q.subjectCode);
      if (!subjectId) {
        throw new Error(`Subject code ${q.subjectCode} not found in database.`);
      }

      return {
        subject_id: subjectId,
        topic: q.topic,
        question_text: q.questionText,
        option_a: q.optionA,
        option_b: q.optionB,
        option_c: q.optionC,
        option_d: q.optionD,
        correct_answer: q.correctAnswer,
        explanation: q.explanation || null,
        difficulty_level: q.difficultyLevel,
        source_classification: 'verified_past_question',
        source_title: 'JAMB Full Practice Paper Document',
        exam_year: q.examYear || 2024,
        review_status: 'approved',
        is_active: true,
      };
    });

    // 3. Insert into Supabase questions table
    const { data, error } = await supabase
      .from('questions')
      .insert(formattedQuestions)
      .select('id');

    if (error) throw error;

    return { success: true, count: data?.length || 0 };
  } catch (err: any) {
    return { 
      success: false, 
      count: 0, 
      error: err.message || 'Failed to seed question bank.' 
    };
  }
}