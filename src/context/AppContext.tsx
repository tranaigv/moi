import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Question,
  UserRole,
  StudentProfile,
  ClassGroup,
  Assignment,
  AnswerLog,
  Subject,
  Difficulty,
} from '../types';
import {
  INITIAL_QUESTIONS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_ASSIGNMENTS,
} from '../data/initialQuestions';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  addQuestion: (q: Omit<Question, 'id'>) => void;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  importQuestions: (newQuestions: Question[]) => void;
  
  classes: ClassGroup[];
  addClass: (newClass: Omit<ClassGroup, 'id'>) => void;
  assignments: Assignment[];
  addAssignment: (asg: Omit<Assignment, 'id' | 'createdAt' | 'completedStudentIds'>) => void;

  students: any[];
  currentStudent: StudentProfile;
  setCurrentStudent: React.Dispatch<React.SetStateAction<StudentProfile>>;
  answerLogs: AnswerLog[];
  logAnswer: (log: Omit<AnswerLog, 'id' | 'timestamp'>) => void;

  toggleSaveQuestion: (questionId: string) => void;
  isQuestionSaved: (questionId: string) => boolean;

  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  
  activeTab: string;
  setActiveTab: (tab: string) => void;

  addTeacherNoteToStudent: (studentId: string, noteContent: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  QUESTIONS: 'dgnl_questions_v1',
  STUDENT: 'dgnl_current_student_v1',
  STUDENTS_LIST: 'dgnl_students_list_v1',
  LOGS: 'dgnl_answer_logs_v1',
  ASSIGNMENTS: 'dgnl_assignments_v1',
  CLASSES: 'dgnl_classes_v1',
  DARK_MODE: 'dgnl_dark_mode_v1',
  SOUND: 'dgnl_sound_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('student');
  const [activeTab, setActiveTab] = useState<string>('practice');

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      if (saved !== null) return saved === 'true';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(darkMode));
  }, [darkMode]);

  // Sound enabled
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOUND, String(soundEnabled));
  }, [soundEnabled]);

  // Questions Bank
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_QUESTIONS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  }, [questions]);

  // Classes
  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_CLASSES;
  });

  // Assignments
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_ASSIGNMENTS;
  });

  // Students list for Teacher
  const [students, setStudents] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS_LIST);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_STUDENTS;
  });

  // Active student profile
  const [currentStudent, setCurrentStudent] = useState<StudentProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENT);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {
      id: 'stu-01',
      name: 'Trần Minh Hoàng',
      email: 'hoang.tm12a1@gmail.com',
      phone: '0912345678',
      classCode: 'DGNL-12A1',
      targetExam: 'ĐGNL ĐHQG TP.HCM (Mục tiêu 950+)',
      streakDays: 7,
      lastActiveDate: 'Hôm nay',
      totalAnswered: 45,
      correctFirstTry: 32,
      correctSecondTry: 8,
      totalTimeSec: 1850,
      wrongQuestionIds: ['q-math-02', 'q-chem-02'],
      savedQuestionIds: ['q-math-01', 'q-logic-03'],
      teacherNotes: [
        {
          id: 'note-01',
          teacherName: 'ThS. Nguyễn Văn Anh',
          date: '08/09/2026',
          content: 'Em làm rất tốt phần Tư duy logic và Ngôn ngữ! Cần lưu ý luyện thêm 15 phút chuyên đề Hình không gian & Cân bằng ion.',
        },
      ],
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENT, JSON.stringify(currentStudent));
  }, [currentStudent]);

  // Answer logs
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(answerLogs));
  }, [answerLogs]);

  // Actions
  const addQuestion = (q: Omit<Question, 'id'>) => {
    const newQ: Question = {
      ...q,
      id: `q-custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setQuestions((prev) => [newQ, ...prev]);
  };

  const updateQuestion = (id: string, updated: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updated } : q))
    );
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const importQuestions = (newQuestions: Question[]) => {
    setQuestions((prev) => [...newQuestions, ...prev]);
  };

  const addClass = (newClass: Omit<ClassGroup, 'id'>) => {
    const added: ClassGroup = {
      ...newClass,
      id: `cls-${Date.now()}`,
    };
    setClasses((prev) => [...prev, added]);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([...classes, added]));
  };

  const addAssignment = (asg: Omit<Assignment, 'id' | 'createdAt' | 'completedStudentIds'>) => {
    const created: Assignment = {
      ...asg,
      id: `asg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      completedStudentIds: [],
      averageScore: 0,
    };
    setAssignments((prev) => [created, ...prev]);
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify([created, ...assignments]));
  };

  const logAnswer = (logData: Omit<AnswerLog, 'id' | 'timestamp'>) => {
    const newLog: AnswerLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setAnswerLogs((prev) => [newLog, ...prev]);

    // Update current student profile stats
    setCurrentStudent((prev) => {
      const isSuccess = logData.isFirstAttemptCorrect || logData.isSecondAttemptCorrect;
      const isWrong = !logData.isFirstAttemptCorrect && !logData.isSecondAttemptCorrect;
      
      let updatedWrongIds = [...prev.wrongQuestionIds];
      if (isWrong && !updatedWrongIds.includes(logData.questionId)) {
        updatedWrongIds.push(logData.questionId);
      } else if (logData.isFirstAttemptCorrect && updatedWrongIds.includes(logData.questionId)) {
        // Solved correctly on first try -> remove from wrong list
        updatedWrongIds = updatedWrongIds.filter((id) => id !== logData.questionId);
      }

      return {
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
        correctFirstTry: prev.correctFirstTry + (logData.isFirstAttemptCorrect ? 1 : 0),
        correctSecondTry: prev.correctSecondTry + (!logData.isFirstAttemptCorrect && logData.isSecondAttemptCorrect ? 1 : 0),
        totalTimeSec: prev.totalTimeSec + logData.timeSpentSec,
        wrongQuestionIds: updatedWrongIds,
      };
    });
  };

  const toggleSaveQuestion = (questionId: string) => {
    setCurrentStudent((prev) => {
      const exists = prev.savedQuestionIds.includes(questionId);
      return {
        ...prev,
        savedQuestionIds: exists
          ? prev.savedQuestionIds.filter((id) => id !== questionId)
          : [...prev.savedQuestionIds, questionId],
      };
    });
  };

  const isQuestionSaved = (questionId: string) => {
    return currentStudent.savedQuestionIds.includes(questionId);
  };

  const addTeacherNoteToStudent = (studentId: string, noteContent: string) => {
    if (studentId === currentStudent.id) {
      setCurrentStudent((prev) => ({
        ...prev,
        teacherNotes: [
          {
            id: `note-${Date.now()}`,
            teacherName: 'ThS. Nguyễn Văn Anh',
            date: 'Hôm nay',
            content: noteContent,
          },
          ...prev.teacherNotes,
        ],
      }));
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        questions,
        setQuestions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        importQuestions,
        classes,
        addClass,
        assignments,
        addAssignment,
        students,
        currentStudent,
        setCurrentStudent,
        answerLogs,
        logAnswer,
        toggleSaveQuestion,
        isQuestionSaved,
        soundEnabled,
        setSoundEnabled,
        darkMode,
        setDarkMode,
        activeTab,
        setActiveTab,
        addTeacherNoteToStudent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
