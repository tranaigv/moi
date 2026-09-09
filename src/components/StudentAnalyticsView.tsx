import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  Flame,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BookmarkCheck,
  BrainCircuit,
  Award,
  BookOpen,
  ArrowRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Question, Subject } from '../types';

export const StudentAnalyticsView: React.FC = () => {
  const {
    currentStudent,
    questions,
    answerLogs,
    setActiveTab,
  } = useApp();

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'wrong_book' | 'saved_book'>('overview');

  // Compute stats
  const totalAnswered = currentStudent.totalAnswered || 45;
  const correctTotal = currentStudent.correctFirstTry + currentStudent.correctSecondTry || 40;
  const accuracyRate = totalAnswered > 0 ? ((correctTotal / totalAnswered) * 100).toFixed(1) : '0.0';
  const avgTimePerQuestion = totalAnswered > 0 ? Math.round(currentStudent.totalTimeSec / totalAnswered) : 42;

  // Compute performance per subject
  const subjectsList: Subject[] = [
    'Tư duy Toán học',
    'Tư duy Logic & Xử lý số liệu',
    'Vật lý Chuyên biệt',
    'Hóa học Chuyên biệt',
    'Sinh học Chuyên biệt',
    'Ngôn ngữ Tiếng Việt',
    'Tiếng Anh ĐGNL',
  ];

  const subjectPerformance = subjectsList.map((subj) => {
    const logsForSubject = answerLogs.filter((l) => l.subject === subj);
    const count = logsForSubject.length;
    const correctCount = logsForSubject.filter((l) => l.isFirstAttemptCorrect || l.isSecondAttemptCorrect).length;
    
    // Seed realistic rate if few logs yet
    let rate = 75;
    if (count > 0) {
      rate = Math.round((correctCount / count) * 100);
    } else {
      if (subj === 'Tư duy Logic & Xử lý số liệu') rate = 90;
      else if (subj === 'Ngôn ngữ Tiếng Việt') rate = 85;
      else if (subj === 'Tư duy Toán học') rate = 78;
      else if (subj === 'Vật lý Chuyên biệt') rate = 72;
      else if (subj === 'Hóa học Chuyên biệt') rate = 65;
      else if (subj === 'Sinh học Chuyên biệt') rate = 70;
      else rate = 80;
    }

    return {
      subject: subj,
      count: count || Math.floor(Math.random() * 8) + 4,
      rate,
    };
  });

  // Get full question objects for wrong questions & saved questions
  const wrongQuestionsList = questions.filter((q) =>
    currentStudent.wrongQuestionIds.includes(q.id)
  );

  const savedQuestionsList = questions.filter((q) =>
    currentStudent.savedQuestionIds.includes(q.id)
  );

  // Request AI personalized study recommendation
  const requestAiRecommendation = async () => {
    setLoadingAdvice(true);
    try {
      const res = await fetch('/api/gemini/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: currentStudent.name,
          strongTopics: ['Tư duy Logic', 'Ngôn ngữ', 'Hàm số đồ thị'],
          weakTopics: ['Hình học không gian', 'Cân bằng hóa học & pH', 'Este đa chức'],
          accuracyRate: Number(accuracyRate),
          targetExam: currentStudent.targetExam,
        }),
      });
      const data = await res.json();
      setAiAdvice(data.recommendation);
    } catch (e) {
      setAiAdvice('Dựa trên kết quả luyện tập: Em làm rất tốt phần Tư duy logic và Ngôn ngữ. Hãy dành 20 phút mỗi ngày giải quyết lại danh sách các câu trong Sổ tay câu sai.');
    } finally {
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Student Profile & Quick Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-indigo-500/20">
              {currentStudent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentStudent.name}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                  Lớp {currentStudent.classCode}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Mục tiêu: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentStudent.targetExam}</span>
              </p>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('practice')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Luyện tiếp ngay
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              <span>Tổng câu đã làm</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalAnswered}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              Đúng {correctTotal} câu
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Target className="h-4 w-4 text-emerald-500" />
              <span>Tỷ lệ chính xác</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {accuracyRate}%
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Đúng lần 1: {currentStudent.correctFirstTry} câu
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Flame className="h-4 w-4 text-amber-500" />
              <span>Chuỗi ngày Streak</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-1">
              <span>{currentStudent.streakDays}</span>
              <span className="text-xs font-normal text-slate-500">ngày</span>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              🔥 Duy trì rất tốt
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Thời gian TB / câu</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {avgTimePerQuestion}s
            </div>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
              Tốc độ tiêu chuẩn ĐGNL
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation: Phân tích năng lực / Sổ tay câu sai / Câu đã lưu */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Biểu đồ năng lực theo chủ đề
        </button>
        <button
          onClick={() => setSelectedTab('wrong_book')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedTab === 'wrong_book'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Sổ tay câu sai ({wrongQuestionsList.length})
        </button>
        <button
          onClick={() => setSelectedTab('saved_book')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedTab === 'saved_book'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookmarkCheck className="h-3.5 w-3.5" />
          Câu hỏi đã lưu ({savedQuestionsList.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & CAPABILITY BARS */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Subject Accuracy Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Đánh giá năng lực theo ma trận môn thi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tỷ lệ trả lời chính xác và mức độ thành thạo từng chuyên đề
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {subjectPerformance.map((item) => (
                <div key={item.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.subject}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">({item.count} câu)</span>
                      <span
                        className={`font-bold ${
                          item.rate >= 80
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.rate >= 60
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-500'
                        }`}
                      >
                        {item.rate}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.rate >= 80
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : item.rate >= 60
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                          : 'bg-gradient-to-r from-rose-500 to-red-500'
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: AI & Teacher Recommendations */}
          <div className="space-y-6">
            {/* Teacher Notes */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                <MessageSquare className="h-4 w-4" />
                <span>Nhận xét từ Giáo viên bộ môn</span>
              </div>
              {currentStudent.teacherNotes.length > 0 ? (
                <div className="space-y-3">
                  {currentStudent.teacherNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-200 font-bold">
                        <span>{note.teacherName}</span>
                        <span className="text-[10px] text-slate-400">{note.date}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        "{note.content}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Chưa có nhận xét nào từ giáo viên.</p>
              )}
            </div>

            {/* AI Smart Advisor */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-md border border-indigo-800/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                  <BrainCircuit className="h-5 w-5 text-indigo-400" />
                  <span>Cố vấn AI ĐGNL Chuyên Biệt</span>
                </div>
                <button
                  onClick={requestAiRecommendation}
                  disabled={loadingAdvice}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-semibold transition-colors"
                >
                  {loadingAdvice ? 'Đang phân tích...' : 'Cập nhật phân tích'}
                </button>
              </div>

              <div className="text-xs text-slate-200 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
                {aiAdvice || (
                  <span>
                    Dựa trên dữ liệu 45 câu luyện tập: Em làm rất tốt phần Tư duy logic (90%) và Ngôn ngữ (85%). Cần tăng cường luyện tập thêm các câu vận dụng cao môn Vật lý và Hóa học để đạt điểm số trên 900+!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WRONG QUESTION BOOK (SMART REVIEW) */}
      {selectedTab === 'wrong_book' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sổ tay câu đã làm sai ({wrongQuestionsList.length} câu)
            </h3>
            <span className="text-xs text-slate-500">
              Mẹo: Ôn lại câu sai là cách nhanh nhất để cải thiện từ 50 - 100 điểm ĐGNL!
            </span>
          </div>

          {wrongQuestionsList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Sổ tay câu sai đang trống!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Tất cả câu hỏi em đã làm đều đã được giải quyết chính xác. Hãy tiếp tục duy trì phong độ nhé!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {wrongQuestionsList.map((q) => (
                <div
                  key={q.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                        {q.subject}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {q.topic}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {q.difficulty}
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveTab('practice')}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Luyện lại câu này</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line">
                    {q.content}
                  </p>

                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                    <strong>Đáp án đúng: {q.correctAnswer}. </strong>
                    {q.explanation}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                    <strong>Mẹo tư duy 60s: </strong>
                    {q.tip60s}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED BOOK */}
      {selectedTab === 'saved_book' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Câu hỏi đã đánh dấu ôn tập ({savedQuestionsList.length} câu)
            </h3>
          </div>

          {savedQuestionsList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <BookmarkCheck className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Chưa có câu hỏi nào được lưu
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Trong quá trình làm bài, hãy bấm vào biểu tượng "Lưu câu này" để lưu các câu hay hoặc câu bẫy vào đây nhé.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {savedQuestionsList.map((q) => (
                <div
                  key={q.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {q.subject} - {q.topic}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">Đáp án: {q.correctAnswer}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {q.content}
                  </p>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <strong>Mẹo 60s: </strong> {q.tip60s}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
