import { supabase } from './supabase';
import { fullDocumentQuestions } from './fullQuestionBankData';

export interface RawQuestionInput {
  subjectCode?: string;
  subject?: string;
  topic?: string;
  questionText?: string;
  question_text?: string;
  image_url?: string | null;
  optionA?: string;
  option_a?: string;
  optionB?: string;
  option_b?: string;
  optionC?: string;
  option_c?: string;
  optionD?: string;
  option_d?: string;
  correctAnswer?: string;
  correct_option?: string;
  explanation?: string;
  difficultyLevel?: string;
  difficulty_level?: string;
  examYear?: number;
  exam_year?: number;
  section_instruction?: string;
  passage_text?: string;
}

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

    const { data: dbSubjects } = await supabase.from('subjects').select('id, code, name');
    const subjectMap = new Map<string, string>();
    dbSubjects?.forEach((s) => {
      if (s.code) subjectMap.set(s.code, s.id);
      if (s.name) subjectMap.set(s.name, s.id);
    });

    const formattedQuestions = fullDocumentQuestions.map((q: any) => {
      const rawSubjectCode = typeof q.subjectCode === 'string' ? q.subjectCode : '';
      const rawSubjectName = typeof q.subject === 'string' ? q.subject : '';
      
      const fullSubjectName =
        SUBJECT_NAME_MAP[rawSubjectCode] ||
        rawSubjectName ||
        SUBJECT_NAME_MAP[rawSubjectName] ||
        'General';

      const subjectId =
        subjectMap.get(rawSubjectCode) ||
        subjectMap.get(rawSubjectName) ||
        subjectMap.get(fullSubjectName) ||
        null;

      let rawQuestionText = (q.questionText ?? q.question_text ?? '').toString();
      const cleanedQuestionText = rawQuestionText.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>');

      return {
        subject: fullSubjectName,
        subject_id: subjectId,
        topic: q.topic || 'General Topic',
        section_instruction: q.section_instruction || null,
        passage_text: q.passage_text || null,
        question_text: cleanedQuestionText,
        image_url: q.image_url || null,
        option_a: q.optionA ?? q.option_a ?? 'Option A',
        option_b: q.optionB ?? q.option_b ?? 'Option B',
        option_c: q.optionC ?? q.option_c ?? 'Option C',
        option_d: q.optionD ?? q.option_d ?? 'Option D',
        correct_option: q.correctAnswer ?? q.correct_option ?? 'A',
        explanation: q.explanation || 'No detailed explanation provided.',
        difficulty_level: q.difficultyLevel ?? q.difficulty_level ?? 'medium',
        source_classification: 'verified_past_question',
        source_title: 'JAMB Full Practice Paper Document',
        exam_year: q.examYear ?? q.exam_year ?? 2024,
        review_status: 'approved',
        is_active: true,
      };
    });

    const chunkSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < formattedQuestions.length; i += chunkSize) {
      const chunk = formattedQuestions.slice(i, i + chunkSize);
      const { error } = await supabase.from('questions').insert(chunk);

      if (error) {
        console.error(`Error uploading chunk starting at index ${i}:`, error.message);
        return { success: false, count: totalInserted, error: error.message };
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