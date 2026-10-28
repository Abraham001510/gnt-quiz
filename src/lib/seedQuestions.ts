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

// Fallback subject mapping if relational subjects table is used
const SUBJECT_NAME_MAP: Record<string, string> = {
  ENG: 'Use of English',
  MTH: 'Mathematics',
  PHY: 'Physics',
  CHM: 'Chemistry',
  BIO: 'Biology',
  CRS: 'Christian Religious Studies',
  GOV: 'Government',
  ECO: 'Economics',
  COM: 'Commerce',
  LIT: 'Literature in English',
  ACC: 'Principles of Accounts',
};

export async function seedQuestionBank(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log(`Starting migration of ${fullDocumentQuestions.length} past questions...`);

    // 1. Fetch active subjects or map directly
    const { data: dbSubjects } = await supabase.from('subjects').select('id, code, name');
    const subjectMap = new Map<string, string>();
    dbSubjects?.forEach((s) => subjectMap.set(s.code, s.id));

    // 2. Format all extracted document questions with standard formatting
    const formattedQuestions = fullDocumentQuestions.map((q) => {
      const subjectCode = typeof q.subjectCode === 'string' ? q.subjectCode : '';
      const fullSubjectName = SUBJECT_NAME_MAP[subjectCode] || subjectCode || 'General';
      const subjectId = subjectMap.get(subjectCode) || null;

      // Convert LaTeX \underline{...} to HTML <u>...</u> for Use of English
      const questionText = typeof q.questionText === 'string' ? q.questionText : '';
      const cleanedQuestionText = questionText.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>');

      return {
        subject: fullSubjectName, // String fallback for simple schema
        subject_id: subjectId,     // Relational ID if available
        topic: q.topic || 'General Topic',
        question_text: cleanedQuestionText,
        option_a: q.optionA,
        option_b: q.optionB,
        option_c: q.optionC,
        option_d: q.optionD,
        correct_answer: q.correctAnswer,
        correct_option: q.correctAnswer, // Dual compatibility
        explanation: q.explanation || 'No detailed explanation provided.',
        difficulty_level: q.difficultyLevel || 'medium',
        source_classification: 'verified_past_question',
        source_title: 'JAMB Full Practice Paper Document',
        exam_year: q.examYear || 2024,
        review_status: 'approved',
        is_active: true,
      };
    });

    // 3. Batch Insert in Chunks of 100 to avoid Supabase limits
    const chunkSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < formattedQuestions.length; i += chunkSize) {
      const chunk = formattedQuestions.slice(i, i + chunkSize);
      const { error } = await supabase.from('questions').insert(chunk);

      if (error) {
        console.error(`Error uploading chunk starting at index ${i}:`, error.message);
      } else {
        totalInserted += chunk.length;
      }
    }

    return { success: true, count: totalInserted };
  } catch (err: any) {
    console.error('Seeding exception:', err);
    return {
      success: false,
      count: 0,
      error: err.message || 'Failed to seed question bank.',
    };
  }
}