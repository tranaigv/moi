import React, { useState } from 'react';
import {
  Users,
  Plus,
  QrCode,
  Share2,
  Download,
  Printer,
  Award,
  TrendingUp,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ClassReportsManager: React.FC = () => {
  const { classes, addClass, students } = useApp();

  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>('');
  const [newClassCode, setNewClassCode] = useState<string>('');
  const [newClassGrade, setNewClassGrade] = useState<string>('Khối 12');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassCode.trim()) return;

    addClass({
      name: newClassName,
      code: newClassCode.toUpperCase(),
      grade: newClassGrade,
      school: 'THPT Chuyên',
      teacherName: 'ThS. Nguyễn Văn Anh',
      studentCount: 0,
    });

    setIsAddClassModalOpen(false);
    setNewClassName('');
    setNewClassCode('');
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Ranking of top students
  const leaderboard = [...students].sort((a, b) => b.accuracyRate - a.accuracyRate);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Quản Lý Danh Sách Lớp & Bảng Xếp Hạng Năng Lực
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cấp mã lớp cho học sinh đăng ký, phân nhóm ôn tập và xuất phiếu đánh giá năng lực.
          </p>
        </div>

        <button
          onClick={() => setIsAddClassModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/25 transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Tạo mã lớp mới
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {cls.grade}
              </span>
              <span className="text-xs text-slate-500">
                Sĩ số: <strong>{cls.studentCount || 38}</strong> em
              </span>
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                {cls.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{cls.school}</p>
            </div>

            {/* Shareable Code Card */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">
                  Mã lớp cho học sinh
                </div>
                <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  {cls.code}
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(cls.code)}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Sao chép mã lớp"
              >
                {copiedCode === cls.code ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[10px] text-emerald-600">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Chép mã</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Class Leaderboard & Performance Analysis */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bảng Xếp Hạng Năng Lực & Tỷ Lệ Chính Xác Toàn Lớp
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Xếp hạng dựa trên tỷ lệ trả lời đúng ngay lần đầu và tổng số câu đã rèn luyện
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              In danh sách
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Thứ hạng</th>
                <th className="py-2.5 px-3">Học sinh</th>
                <th className="py-2.5 px-3 text-center">Chuỗi ngày</th>
                <th className="py-2.5 px-3 text-center">Tổng câu làm</th>
                <th className="py-2.5 px-3 text-center">Đúng lần 1</th>
                <th className="py-2.5 px-3 text-center">Tỷ lệ đúng</th>
                <th className="py-2.5 px-3">Đánh giá chung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.map((stu, index) => (
                <tr key={stu.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                        index === 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-400'
                          : index === 1
                          ? 'bg-slate-200 text-slate-700'
                          : index === 2
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{stu.name}</div>
                    <div className="text-[11px] text-slate-400">{stu.targetExam}</div>
                  </td>

                  <td className="py-3 px-3 text-center font-semibold text-amber-600">
                    🔥 {stu.streakDays} ngày
                  </td>

                  <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                    {stu.totalAnswered} câu
                  </td>

                  <td className="py-3 px-3 text-center font-medium text-emerald-600">
                    {stu.correctFirstTry} câu
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {stu.accuracyRate}%
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        stu.status === 'Xuất sắc' || stu.status === 'Tốt'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {stu.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Class Modal */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tạo Lớp Học & Mã Luyện Mới
              </h3>
              <button
                onClick={() => setIsAddClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên lớp học
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lớp 12A4 - Chuyên đề Toán & Logic ĐGNL"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã lớp (Học sinh nhập mã này để tham gia)
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: DGNL-12A4"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Khối lớp
                </label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Khối 12">Khối 12 (Ôn thi ĐGNL năm nay)</option>
                  <option value="Khối 11">Khối 11 (Ôn sớm)</option>
                  <option value="Khối 10">Khối 10 (Làm quen)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                >
                  Tạo lớp ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
