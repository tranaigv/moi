import React, { useState } from 'react';
import {
  Users,
  Award,
  Clock,
  AlertTriangle,
  Send,
  Download,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  CheckCircle2,
  BookOpen,
  Filter,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TeacherDashboardView: React.FC = () => {
  const {
    students,
    classes,
    questions,
    addTeacherNoteToStudent,
    setActiveTab,
  } = useApp();

  const [selectedClassCode, setSelectedClassCode] = useState<string>('DGNL-12A1');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Feedback modal
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<any | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [noteSentSuccess, setNoteSentSuccess] = useState<boolean>(false);

  // Filter students for the active class
  const classStudents = students.filter(
    (s) => s.classCode === selectedClassCode
  );

  const filteredStudents = classStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute class metrics
  const totalStudents = classStudents.length;
  const avgAccuracy =
    classStudents.reduce((acc, s) => acc + (s.accuracyRate || 0), 0) / (totalStudents || 1);
  const totalQuestionsDone = classStudents.reduce((acc, s) => acc + (s.totalAnswered || 0), 0);
  const studentsNeedingSupport = classStudents.filter(
    (s) => s.accuracyRate < 60 || s.totalAnswered < 20
  );

  // Subject weakness frequency across class
  const subjectWeakness = [
    { subject: 'Hình học không gian & Thể tích', failRate: 48, count: 18 },
    { subject: 'Cân bằng hóa học & pH ion', failRate: 42, count: 16 },
    { subject: 'Este - Lipit đa chức', failRate: 38, count: 14 },
    { subject: 'Điện xoay chiều RLC & Dao động', failRate: 35, count: 13 },
    { subject: 'Xử lý số liệu & Đọc đồ thị', failRate: 28, count: 10 },
    { subject: 'Di truyền liên kết & Quần thể', failRate: 25, count: 9 },
  ];

  const handleSendNote = () => {
    if (!selectedStudentForNote || !noteText.trim()) return;
    addTeacherNoteToStudent(selectedStudentForNote.id, noteText);
    setNoteSentSuccess(true);
    setTimeout(() => {
      setNoteSentSuccess(false);
      setSelectedStudentForNote(null);
      setNoteText('');
    }, 1500);
  };

  // Export class report to CSV
  const handleExportCSV = () => {
    const headers = ['Mã HS', 'Họ và tên', 'Email', 'Lớp', 'Tổng câu làm', 'Đúng lần 1', 'Tỷ lệ đúng (%)', 'Đánh giá'];
    const rows = classStudents.map((s) => [
      s.id,
      `"${s.name}"`,
      s.email,
      s.classCode,
      s.totalAnswered,
      s.correctFirstTry,
      `${s.accuracyRate}%`,
      s.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_cao_nang_luc_${selectedClassCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Dashboard Giáo Viên - Quản Lý Năng Lực Lớp
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
              Trực quan 30 giây
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tiến độ luyện tập, chẩn đoán điểm nghẽn kiến thức và can thiệp kịp thời cho học sinh.
          </p>
        </div>

        {/* Class switcher & Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClassCode}
            onChange={(e) => setSelectedClassCode(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.code}>
                {cls.name} ({cls.code})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Xuất Excel/CSV
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            In báo cáo
          </button>
        </div>
      </div>

      {/* 4 Overview Class KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Users className="h-4 w-4 text-indigo-500" />
            <span>Sĩ số lớp luyện</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalStudents} học sinh
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            100% tài khoản đã kích hoạt
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Award className="h-4 w-4 text-emerald-500" />
            <span>Tỷ lệ chính xác TB</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {avgAccuracy.toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Mục tiêu lớp: {'>'} 80%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span>Tổng lượt giải câu hỏi</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalQuestionsDone} lượt
          </div>
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
            Ngân hàng: {questions.length} câu chuẩn
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <span>Học sinh cần hỗ trợ</span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {studentsNeedingSupport.length} em
          </div>
          <p className="text-[11px] text-rose-500 font-semibold mt-0.5">
            Tỷ lệ đúng &lt; 60%
          </p>
        </div>
      </div>

      {/* Main Grid: Student Attention List & Subject Weakness Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Students List with Detailed Tracking */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Chi tiết tiến độ học sinh trong lớp
              </h2>
              <p className="text-xs text-slate-500">
                Click vào học sinh để gửi nhận xét & khuyến nghị ôn tập cá nhân hóa
              </p>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-48 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Table of students */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-2.5 px-3">Học sinh</th>
                  <th className="py-2.5 px-3">Mục tiêu</th>
                  <th className="py-2.5 px-3 text-center">Đã làm</th>
                  <th className="py-2.5 px-3 text-center">Tỷ lệ đúng</th>
                  <th className="py-2.5 px-3">Điểm yếu chính</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((stu) => {
                  const isLow = stu.accuracyRate < 60;
                  return (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {stu.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{stu.email}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {stu.targetExam.split('(')[0]}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-semibold text-slate-800 dark:text-slate-200">
                        {stu.totalAnswered} câu
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            isLow
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {stu.accuracyRate}%
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {stu.weakTopics?.map((topic: string) => (
                            <span
                              key={topic}
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudentForNote(stu);
                            setNoteText(
                              `Chào ${stu.name}, thầy nhận thấy em cần tập trung ôn kỹ phần ${stu.weakTopics?.join(', ') || 'kiến thức vận dụng'}. Hãy làm lại danh sách các câu trong Sổ tay câu sai trước hạn nộp tới nhé!`
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Send className="h-3 w-3" />
                          Nhận xét
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Top Class Weaknesses & Matrix */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Phân tích chuyên đề hay sai
              </h2>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
                Cần ôn tập gấp
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Các chủ đề có tỷ lệ trả lời sai cao nhất trong toàn bộ bài thi thử và luyện tập của lớp:
            </p>

            <div className="space-y-3.5 pt-1">
              {subjectWeakness.map((item) => (
                <div key={item.subject} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.subject}
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      Sai {item.failRate}% ({item.count} em)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${item.failRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveTab('create_assignment')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/25 transition-colors flex items-center justify-center gap-1.5"
              >
                <Award className="h-4 w-4" />
                Tạo đề ôn chuyên sâu cho chuyên đề này
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {selectedStudentForNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Gửi nhận xét ôn tập cá nhân hóa
                </h3>
                <p className="text-xs text-slate-500">
                  Người nhận: <span className="font-semibold">{selectedStudentForNote.name}</span> ({selectedStudentForNote.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForNote(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Nhập lời nhắc, khuyến nghị ôn tập, dạng bài tập cần củng cố..."
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 resize-none leading-relaxed"
            />

            {noteSentSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Đã gửi nhận xét thành công đến học sinh!
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedStudentForNote(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSendNote}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/25 flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Gửi ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
