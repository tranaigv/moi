import React, { useState, useRef } from 'react';
import {
  ClipboardList,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  BookOpen,
  Paperclip,
  FileText,
  UploadCloud,
  X,
  Download,
  FileCheck,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Subject, Difficulty, AssignmentAttachment } from '../types';

export const AssignmentManager: React.FC = () => {
  const {
    role,
    assignments,
    addAssignment,
    classes,
    currentStudent,
    setActiveTab,
  } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [classCode, setClassCode] = useState<string>('DGNL-12A1');
  const [subject, setSubject] = useState<Subject | 'Tất cả các môn'>('Tư duy Logic & Xử lý số liệu');
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [timeLimitMin, setTimeLimitMin] = useState<number>(20);
  const [deadline, setDeadline] = useState<string>('2026-09-20T23:59');

  // Attachment states
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadedAttachment, setUploadedAttachment] = useState<AssignmentAttachment | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validExtensions = ['.doc', '.docx', '.pdf', '.json', '.txt'];
      const fileName = file.name.toLowerCase();
      const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

      if (!isValid) {
        setAttachmentError('Định dạng tệp không được hỗ trợ. Vui lòng chọn .doc, .docx hoặc .pdf.');
        return;
      }

      setAttachmentFile(file);
      setAttachmentError(null);
      setIsUploadingAttachment(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload-assignment-file', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Lỗi khi tải tệp đính kèm');
        }

        setUploadedAttachment(data.attachment);
      } catch (err: any) {
        console.error('Failed to upload assignment attachment:', err);
        setAttachmentError(err.message || 'Không thể tải tệp lên');
        setAttachmentFile(null);
      } finally {
        setIsUploadingAttachment(false);
      }
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setUploadedAttachment(null);
    setAttachmentError(null);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addAssignment({
      title,
      classCode,
      subject,
      questionCount,
      timeLimitMin,
      deadline,
      assignedBy: 'ThS. Nguyễn Văn Anh',
      attachment: uploadedAttachment || undefined,
    });

    setIsCreateModalOpen(false);
    setTitle('');
    setAttachmentFile(null);
    setUploadedAttachment(null);
  };

  // Helper to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  // Filter assignments relevant to current user
  const displayAssignments = role === 'student'
    ? assignments.filter((a) => a.classCode === currentStudent.classCode)
    : assignments;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {role === 'student'
                ? `Bài Tập & Đề Thi Thử Của Lớp (${currentStudent.classCode})`
                : 'Quản Lý Bài Tập & Đề Thi Thử Giao Cho Lớp'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
              {displayAssignments.length} bài tập
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {role === 'student'
              ? 'Hoàn thành bài tập đúng hạn để giáo viên theo dõi tiến độ và tải tệp đề thi (.doc, .docx, .pdf) gốc nếu có.'
              : 'Thiết lập thời hạn, số lượng câu hỏi, đính kèm đề thi (.doc, .docx, .pdf) và theo dõi tỷ lệ hoàn thành của học sinh.'}
          </p>
        </div>

        {role === 'teacher' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/25 transition-all flex items-center gap-1.5 self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            Tạo bài tập mới (kèm file .DOC/.PDF)
          </button>
        )}
      </div>

      {/* Assignment cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayAssignments.map((asg) => {
          const isCompletedByStudent = asg.completedStudentIds?.includes(currentStudent.id);
          const deadlineDate = new Date(asg.deadline).toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
          });

          return (
            <div
              key={asg.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
                    Lớp: {asg.classCode}
                  </span>
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Hạn nộp: {deadlineDate}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {asg.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                    {asg.subject}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    {asg.questionCount} câu hỏi
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    {asg.timeLimitMin} phút
                  </span>
                </div>

                {/* Attached Document File Display if present */}
                {asg.attachment && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {asg.attachment.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {formatFileSize(asg.attachment.size)} • Tệp đính kèm
                        </p>
                      </div>
                    </div>

                    <a
                      href={asg.attachment.dataUrl || '#'}
                      download={asg.attachment.name}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 shrink-0 transition-colors"
                      title="Tải tệp đề thi gốc về máy"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Tải đề
                    </a>
                  </div>
                )}
              </div>

              {/* Action/Progress footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {role === 'student' ? (
                  isCompletedByStudent ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Đã nộp bài</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTab('practice')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Bắt đầu làm bài</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )
                ) : (
                  <div className="flex items-center justify-between w-full text-xs">
                    <span className="text-slate-500">
                      Đã nộp: <strong>{asg.completedStudentIds?.length || 0}</strong> học sinh
                    </span>
                    <span className="font-bold text-indigo-600">
                      Điểm TB: {asg.averageScore ? `${asg.averageScore}/100` : 'Đang chấm'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Assignment Modal with File Attachment */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in zoom-in-95 my-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-600" />
                Giao Bài Tập / Đề Thi Thử Cho Lớp
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề bài tập
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Đề rèn luyện Tư duy Định lượng tuần 3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Giao cho lớp
                  </label>
                  <select
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.code}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chuyên đề / Môn
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Tất cả các môn">Tất cả các môn (Đề tổng hợp)</option>
                    <option value="Tư duy Toán học">Tư duy Toán học</option>
                    <option value="Tư duy Logic & Xử lý số liệu">Tư duy Logic & Xử lý số liệu</option>
                    <option value="Vật lý Chuyên biệt">Vật lý Chuyên biệt</option>
                    <option value="Hóa học Chuyên biệt">Hóa học Chuyên biệt</option>
                    <option value="Sinh học Chuyên biệt">Sinh học Chuyên biệt</option>
                    <option value="Ngôn ngữ Tiếng Việt">Ngôn ngữ Tiếng Việt</option>
                    <option value="Tiếng Anh ĐGNL">Tiếng Anh ĐGNL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số lượng câu hỏi
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thời gian làm (phút)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={timeLimitMin}
                    onChange={(e) => setTimeLimitMin(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hạn chót nộp bài
                </label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Upload Document (.doc, .docx, .pdf) as attachment */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-indigo-600" />
                    Đính kèm tệp đề thi (.doc, .docx, .pdf)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Tùy chọn</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".doc,.docx,.pdf,.json,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadedAttachment ? (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="font-bold text-emerald-900 dark:text-emerald-100 truncate">
                          {uploadedAttachment.name}
                        </p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                          {formatFileSize(uploadedAttachment.size)} • Đã sẵn sàng đính kèm
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeAttachment}
                      className="p-1 rounded-md text-emerald-700 hover:text-rose-600 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                      title="Xóa tệp đính kèm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <UploadCloud className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300">
                        Chọn tệp đề Word (.doc, .docx) hoặc PDF (.pdf)
                      </span>
                    </div>

                    {isUploadingAttachment ? (
                      <Loader2 className="h-4 w-4 text-indigo-600 animate-spin shrink-0" />
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                        Chọn tệp
                      </span>
                    )}
                  </div>
                )}

                {attachmentError && (
                  <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                    {attachmentError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploadingAttachment}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm disabled:opacity-50"
                >
                  Phát bài tập cho lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
