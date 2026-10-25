import { supabase } from './supabase';

export interface SubjectScoreBreakdown {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  scoreOutOf100: number;
}

export interface DetailedExamResult {
  attemptId: string;
  totalQuestions: number;
  totalAnswered: number;
  totalCorrect: number;
  jambAggregateScore: number; // Scaled to 400
  accuracyPercentage: number;
  startedAt: string;
  submittedAt: string;
  subjectBreakdowns: SubjectScoreBreakdown[];
  questionsReview: Array<{
    questionId: string;
    questionText: string;
    imageUrl?: string | null;
    subjectName: string;
    topic: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    selectedOption: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string | null;
  }>;
}

export async function calculateAndFinalizeExamResult(attemptId: string): Promise<DetailedExamResult | null> {
  try {
    // 1. Fetch attempt record
    const { data: attempt, error: attemptErr } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (attemptErr || !attempt) throw new Error('Attempt not found.');

    // 2. Fetch attempt questions & corresponding questions data
    const { data: attemptQs, error: qErr } = await supabase
      .from('attempt_questions')
      .select('question_id, subject_id, questions(*)')
      .eq('attempt_id', attemptId);

    if (qErr || !attemptQs) throw new Error('Failed to fetch attempt questions.');

    // 3. Fetch saved student answers
    const { data: savedAnswers, error: ansErr } = await supabase
      .from('student_answers')
      .select('question_id, selected_option')
      .eq('attempt_id', attemptId);

    if (ansErr) throw ansErr;

    const answersMap = new Map<string, string>();
    savedAnswers?.forEach((ans) => {
      if (ans.selected_option) answersMap.set(ans.question_id, ans.selected_option);
    });

    // 4. Fetch subjects list
    const subIds = Array.from(new Set(attemptQs.map((item: any) => item.subject_id)));
    const { data: subjects } = await supabase.from('subjects').select('*').in('id', subIds);
    const subjectMap = new Map<string, string>();
    subjects?.forEach((s) => subjectMap.set(s.id, s.name));

    // 5. Perform question-by-question grading
    let totalCorrect = 0;
    let totalAnswered = 0;
    const questionsReview: DetailedExamResult['questionsReview'] = [];

    const subjectStatsMap = new Map<string, { total: number; answered: number; correct: number }>();
    subIds.forEach((id) => subjectStatsMap.set(id, { total: 0, answered: 0, correct: 0 }));

    attemptQs.forEach((item: any) => {
      const q = item.questions;
      const selected = answersMap.get(q.id) || null;
      const isCorrect = selected === q.correct_answer;

      if (selected) totalAnswered++;
      if (isCorrect) totalCorrect++;

      const subStat = subjectStatsMap.get(item.subject_id);
      if (subStat) {
        subStat.total++;
        if (selected) subStat.answered++;
        if (isCorrect) subStat.correct++;
      }

      questionsReview.push({
        questionId: q.id,
        questionText: q.question_text,
        imageUrl: q.image_url,
        subjectName: subjectMap.get(item.subject_id) || 'Subject',
        topic: q.topic,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        selectedOption: selected,
        correctAnswer: q.correct_answer,
        isCorrect,
        explanation: q.explanation,
      });
    });

    // 6. Calculate subject breakdowns and JAMB Aggregate (out of 400)
    const subjectBreakdowns: SubjectScoreBreakdown[] = [];
    let jambAggregateScore = 0;

    subjectStatsMap.forEach((stat, subId) => {
      const scoreOutOf100 = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
      jambAggregateScore += scoreOutOf100;

      subjectBreakdowns.push({
        subjectId: subId,
        subjectName: subjectMap.get(subId) || 'Subject',
        totalQuestions: stat.total,
        answeredQuestions: stat.answered,
        correctAnswers: stat.correct,
        wrongAnswers: stat.answered - stat.correct,
        scoreOutOf100,
      });
    });

    const accuracyPercentage = attemptQs.length > 0 ? Math.round((totalCorrect / attemptQs.length) * 100) : 0;

    // 7. Update database attempt record with final scores
    await supabase
      .from('exam_attempts')
      .update({
        raw_score: totalCorrect,
        percentage_score: jambAggregateScore,
        is_finalized: true,
        submitted_at: attempt.submitted_at || new Date().toISOString(),
      })
      .eq('id', attemptId);

    return {
      attemptId,
      totalQuestions: attemptQs.length,
      totalAnswered,
      totalCorrect,
      jambAggregateScore,
      accuracyPercentage,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at || new Date().toISOString(),
      subjectBreakdowns,
      questionsReview,
    };
  } catch (err: any) {
    console.error('Error calculating exam result:', err);
    return null;
  }
}