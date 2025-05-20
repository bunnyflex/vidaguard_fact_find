import ExcelJS from 'exceljs';

interface FactFindAnswer {
  question: string;
  answer: string;
}

interface FactFindData {
  sessionId: number;
  userName: string;
  userEmail: string;
  dateCompleted: string;
  answers: FactFindAnswer[];
}

/**
 * Generate Excel file from fact find data
 */
export async function generateFactFindExcel(data: FactFindData): Promise<Buffer> {
  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Fact Find Data');

  // Add header information
  worksheet.addRow(['Insurance Fact Find Summary']);
  worksheet.addRow(['Session ID', data.sessionId]);
  worksheet.addRow(['Date Completed', data.dateCompleted]);
  worksheet.addRow(['Client Name', data.userName]);
  worksheet.addRow(['Client Email', data.userEmail]);
  worksheet.addRow([]);

  // Add column headers for questions and answers
  worksheet.addRow(['Question', 'Answer']);

  // Add data rows
  data.answers.forEach(item => {
    worksheet.addRow([item.question, item.answer]);
  });

  // Format header row
  worksheet.getRow(1).font = { bold: true, size: 16 };
  worksheet.getRow(7).font = { bold: true };

  // Set column widths
  worksheet.getColumn(1).width = 40;
  worksheet.getColumn(2).width = 60;

  // Generate buffer
  return await workbook.xlsx.writeBuffer();
}

/**
 * Format structured fact find data to simplified format for Excel
 */
export function formatFactFindDataForExcel(
  session: { id: number; completedAt?: Date | null; }, 
  user: { name?: string | null; email: string; },
  answers: Array<{ question: { text: string; }; value: string; }>
): FactFindData {
  const formattedAnswers = answers.map(a => ({
    question: a.question.text,
    answer: a.value
  }));

  return {
    sessionId: session.id,
    userName: user.name || user.email,
    userEmail: user.email,
    dateCompleted: session.completedAt?.toISOString() || new Date().toISOString(),
    answers: formattedAnswers
  };
}

export default {
  generateFactFindExcel,
  formatFactFindDataForExcel
};
