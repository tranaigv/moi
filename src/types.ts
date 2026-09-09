export type UserRole = 'student' | 'teacher';

export type Subject =
  | 'Tư duy Toán học'
  | 'Tư duy Logic & Xử lý số liệu'
  | 'Vật lý Chuyên biệt'
  | 'Hóa học Chuyên biệt'
  | 'Sinh học Chuyên biệt'
  | 'Ngôn ngữ Tiếng Việt'
  | 'Tiếng Anh ĐGNL';

export type Difficulty = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export type QuestionType =
  | 'Trắc nghiệm 4 phương án'
  | 'Phân tích dữ liệu & Biểu đồ'
  | 'Suy luận logic nhiều bước'
  | 'Điền kết quả ngắn';

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  content: string;
  options: QuestionOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  hint1: string; // Gợi ý logic / công thức duy nhất khi sai lần 1 (không lộ đáp án)
  explanation: string; // Lời giải thích súc tích
  tip60s: string; // Mẹo tư duy 60 giây (shortcut, nhận diện bẫy)
  examTag?: string; // Ví dụ: ĐGNL ĐHQG HCM, HSA ĐHQG HN, ĐH Sư Phạm
  createdAt?: string;
}

export interface AnswerLog {
  id: string;
  questionId: string;
  studentId: string;
  firstAttemptAnswer?: 'A' | 'B' | 'C' | 'D';
  secondAttemptAnswer?: 'A' | 'B' | 'C' | 'D';
  finalAnswer: 'A' | 'B' | 'C' | 'D';
  isFirstAttemptCorrect: boolean;
  isSecondAttemptCorrect: boolean;
  timeSpentSec: number;
  hintUsed: boolean;
  timestamp: string;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  classCode: string;
  targetExam: string;
  streakDays: number;
  lastActiveDate: string;
  totalAnswered: number;
  correctFirstTry: number;
  correctSecondTry: number;
  totalTimeSec: number;
  wrongQuestionIds: string[]; // Sổ tay câu sai (smart review)
  savedQuestionIds: string[]; // Đánh dấu ôn tập
  teacherNotes: Array<{
    id: string;
    teacherName: string;
    date: string;
    content: string;
  }>;
}

export interface AssignmentAttachment {
  name: string;
  size: number;
  type: 'doc' | 'docx' | 'pdf' | 'other';
  dataUrl?: string;
  extractedQuestionCount?: number;
}

export interface Assignment {
  id: string;
  title: string;
  classCode: string;
  subject: Subject | 'Tất cả các môn';
  difficulty?: Difficulty | 'Hỗn hợp';
  questionCount: number;
  timeLimitMin: number;
  deadline: string;
  assignedBy: string;
  completedStudentIds: string[];
  averageScore?: number;
  createdAt: string;
  attachment?: AssignmentAttachment;
}

export interface ClassGroup {
  id: string;
  code: string;
  name: string;
  grade: string;
  school: string;
  teacherName: string;
  studentCount: number;
}
