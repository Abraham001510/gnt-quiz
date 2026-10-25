export type UserRole = 'student' | 'admin';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type ReviewStatus = 'pending_review' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  preferred_university: string;
  intended_course: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  subject_id: string;
  topic: string;
  question_text: string;
  image_url?: string | null; // Optional Diagram / Illustration URL
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  difficulty_level: DifficultyLevel;
  source_classification: string;
  source_title: string | null;
  exam_year: number | null;
  review_status: ReviewStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamConfiguration {
  id: string;
  mode: 'full_jamb' | 'subject_practice';
  duration_minutes: number;
  total_questions: number;
  is_active: boolean;
  created_at: string;
}

export interface ExamAttempt {
  id: string;
  student_id: string;
  config_id: string;
  selected_subject_ids: string[];
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
  submission_reason: string | null;
  is_finalized: boolean;
  raw_score: number;
  percentage_score: number;
  created_at: string;
}