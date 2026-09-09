import React from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  BarChart3,
  Flame,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Users,
  FileQuestion,
  ClipboardList,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    role,
    setRole,
    activeTab,
    setActiveTab,
    darkMode,
    setDarkMode,
    soundEnabled,
    setSoundEnabled,
    currentStudent,
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  ĐGNL Chuyên Biệt
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {role === 'student' ? 'Học sinh' : 'Giáo viên'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Hệ thống luyện tập thông minh & Dashboard theo dõi năng lực
              </p>
            </div>
          </div>

          {/* Navigation Links for Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {role === 'student' ? (
              <>
                <button
                  onClick={() => setActiveTab('practice')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'practice'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Luyện tập chuẩn
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Tiến độ & Câu sai
                  {currentStudent.wrongQuestionIds.length > 0 && (
                    <span className="h-4 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {currentStudent.wrongQuestionIds.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'assignments'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Bài tập lớp ({currentStudent.classCode})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('teacher_dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'teacher_dashboard'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Tổng quan lớp
                </button>
                <button
                  onClick={() => setActiveTab('question_bank')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'question_bank'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileQuestion className="h-4 w-4" />
                  Ngân hàng câu hỏi
                </button>
                <button
                  onClick={() => setActiveTab('create_assignment')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'create_assignment'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Giao bài tập
                </button>
                <button
                  onClick={() => setActiveTab('classes_management')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'classes_management'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Lớp & Báo cáo
                </button>
              </>
            )}
          </nav>

          {/* Right Action Bar: Streak, Sound, Dark mode, Role Switcher */}
          <div className="flex items-center gap-2.5">
            {role === 'student' && (
              <div
                title="Chuỗi ngày luyện tập liên tiếp"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs font-bold"
              >
                <Flame className="h-4 w-4 fill-amber-500 text-amber-500 animate-pulse" />
                <span>{currentStudent.streakDays} ngày</span>
              </div>
            )}

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-rose-500" />}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </button>

            {/* Role Switcher Pill */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
              <button
                onClick={() => {
                  setRole('student');
                  setActiveTab('practice');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  role === 'student'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Học sinh</span>
              </button>
              <button
                onClick={() => {
                  setRole('teacher');
                  setActiveTab('teacher_dashboard');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  role === 'teacher'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Giáo viên</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
          {role === 'student' ? (
            <>
              <button
                onClick={() => setActiveTab('practice')}
                className={`px-3 py-1 font-semibold rounded-md ${
                  activeTab === 'practice'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Luyện tập
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1 font-semibold rounded-md ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tiến độ & Câu sai
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-3 py-1 font-semibold rounded-md ${
                  activeTab === 'assignments'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Bài tập ({currentStudent.classCode})
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('teacher_dashboard')}
                className={`px-3 py-1 font-semibold rounded-md ${
                  activeTab === 'teacher_dashboard'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('question_bank')}
                className={`px-3 py-1 font-semibold rounded-md ${
                  activeTab === 'question_bank'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Ngân hàng câu
              </button>
              <button
                onClick={() => setActiveTab('create_assignment')}
                className={`px-3 py-1 font-semibold rounded-md ${
                  activeTab === 'create_assignment'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Giao bài
              </button>
              <button
                onClick={() => setActiveTab('classes_management')}
                className={`px-3 py-1 font-semibold rounded-md ${
                  activeTab === 'classes_management'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Lớp & Báo cáo
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
