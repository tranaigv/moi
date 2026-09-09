import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { StudentPracticeView } from './components/StudentPracticeView';
import { StudentAnalyticsView } from './components/StudentAnalyticsView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { QuestionBankManager } from './components/QuestionBankManager';
import { AssignmentManager } from './components/AssignmentManager';
import { ClassReportsManager } from './components/ClassReportsManager';

const AppContent: React.FC = () => {
  const { role, activeTab } = useApp();

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Student Views */}
        {role === 'student' && (
          <>
            {activeTab === 'practice' && <StudentPracticeView />}
            {activeTab === 'analytics' && <StudentAnalyticsView />}
            {activeTab === 'assignments' && <AssignmentManager />}
          </>
        )}

        {/* Teacher Views */}
        {role === 'teacher' && (
          <>
            {activeTab === 'teacher_dashboard' && <TeacherDashboardView />}
            {activeTab === 'question_bank' && <QuestionBankManager />}
            {activeTab === 'create_assignment' && <AssignmentManager />}
            {activeTab === 'class_manager' && <ClassReportsManager />}
          </>
        )}
      </main>

      {/* Clean, minimalist footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Hệ thống Luyện thi Đánh giá Năng lực Chuyên biệt &bull; Chuẩn ma trận ĐHQG &amp; ĐH Sư Phạm
          </span>
          <span className="text-[11px] text-slate-400">
            Hỗ trợ tư duy tương tác &bull; Phản hồi có điều kiện &bull; Trợ lý AI Gemini
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
