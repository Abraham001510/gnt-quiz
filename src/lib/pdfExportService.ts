import jsPDF from 'jspdf';
import { DetailedExamResult } from './markingEngineService';

export function downloadExamReportPdf(result: DetailedExamResult, studentName: string = 'Student') {
  const doc = new jsPDF();

  // 1. Header & Title Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(52, 211, 153); // emerald-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('GNT QUIZ PLATFORM', 14, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Official JAMB CBT Examination Performance Report', 14, 28);

  // 2. Candidate & Exam Meta
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Candidate Details', 14, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Candidate Name: ${studentName}`, 14, 60);
  doc.text(`Exam Attempt ID: #${result.attemptId.slice(0, 8)}`, 14, 66);
  doc.text(`Date & Time: ${new Date(result.submittedAt).toLocaleString()}`, 14, 72);

  // 3. Score Card Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(120, 46, 76, 32, 3, 3, 'F');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text('AGGREGATE JAMB SCORE', 125, 54);

  doc.setTextColor(16, 185, 129); // emerald-600
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`${result.jambAggregateScore} / 400`, 125, 67);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Accuracy: ${result.accuracyPercentage}% (${result.totalCorrect}/${result.totalQuestions})`, 125, 74);

  // 4. Subject Score Breakdown Table
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 84, 196, 84);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject Performance Breakdown', 14, 94);

  let startY = 104;
  doc.setFillColor(226, 232, 240);
  doc.rect(14, startY, 182, 8, 'F');

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Subject Name', 18, startY + 5.5);
  doc.text('Total Qs', 90, startY + 5.5);
  doc.text('Correct', 120, startY + 5.5);
  doc.text('Score (/100)', 155, startY + 5.5);

  startY += 8;

  result.subjectBreakdowns.forEach((sub, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, startY, 182, 8, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(sub.subjectName, 18, startY + 5.5);
    doc.text(String(sub.totalQuestions), 90, startY + 5.5);
    doc.text(String(sub.correctAnswers), 120, startY + 5.5);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`${sub.scoreOutOf100}`, 155, startY + 5.5);

    startY += 8;
  });

  // 5. Footer Signature Line
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated automatically by GNT Quiz CBT Engine. Verified authentic candidate examination record.', 14, 285);

  // Download Trigger
  doc.save(`JAMB_CBT_Report_${result.attemptId.slice(0, 8)}.pdf`);
}