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

    // 1. Fetch active subjects for relational ID mapping
    const { data: dbSubjects } = await supabase.from('subjects').select('id, code, name');
    const subjectMap = new Map<string, string>();
    dbSubjects?.forEach((s) => {
      if (s.code) subjectMap.set(s.code, s.id);
      if (s.name) subjectMap.set(s.name, s.id);
    });

    // 2. Format questions with automated sanitization for option_d leaks, passage extraction, and target word underlining
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

      let rawOptionD = (q.optionD ?? q.option_d ?? 'Option D').toString();
      let extractedPassage = q.passage_text || null;
      let extractedInstruction = q.section_instruction || null;

      // Clean out concatenated passages or section headers from option_d
      if (rawOptionD.includes('Passage II') || rawOptionD.includes('Passage I')) {
        const parts = rawOptionD.split(/(Passage I{1,3}.*)/s);
        rawOptionD = parts[0].trim();
        if (!extractedPassage) {
          extractedPassage = parts.slice(1).join('').trim();
        }
      }

      if (rawOptionD.includes('SECTION')) {
        const parts = rawOptionD.split(/(SECTION [A-Z]:.*)/s);
        rawOptionD = parts[0].trim();
        if (!extractedInstruction) {
          extractedInstruction = parts.slice(1).join('').trim();
        }
      }

      // Automatically wrap target vocabulary words in <u> tags if missing
      let rawQuestionText = (q.questionText ?? q.question_text ?? '').toString();
      if (!rawQuestionText.includes('<u>')) {
        const targetWords = ['platitudes', 'ratified', 'laconic', 'magnanimous', 'ephemeral', 'trite'];
        targetWords.forEach((word) => {
          const reg = new RegExp(`\\b(${word})\\b`, 'gi');
          rawQuestionText = rawQuestionText.replace(reg, '<u>$1</u>');
        });
      }

      const cleanedQuestionText = rawQuestionText.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>');

      return {
        subject: fullSubjectName,
        subject_id: subjectId,
        topic: q.topic || 'General Topic',
        section_instruction: extractedInstruction,
        passage_text: extractedPassage,
        question_text: cleanedQuestionText,
        image_url: q.image_url || null,
        option_a: q.optionA ?? q.option_a ?? 'Option A',
        option_b: q.optionB ?? q.option_b ?? 'Option B',
        option_c: q.optionC ?? q.option_c ?? 'Option C',
        option_d: rawOptionD || 'Option D',
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

    // 3. Batch Insert in Chunks of 100
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