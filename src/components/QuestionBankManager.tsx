import React, { useState, useRef } from 'react';
import {
  FileQuestion,
  Plus,
  Trash2,
  Edit,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Zap,
  Tag,
  Copy,
  FileText,
  UploadCloud,
  FileCode,
  Loader2,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  Eye,
  FileCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Question, Subject, Difficulty, QuestionType } from '../types';

export const QuestionBankManager: React.FC = () => {
  const { questions, addQuestion, updateQuestion, deleteQuestion, importQuestions } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<Subject | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Document Upload & Import modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [activeImportTab, setActiveImportTab] = useState<'upload' | 'json'>('upload');
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [importStatusType, setImportStatusType] = useState<'success' | 'error' | 'info'>('info');

  // File upload specific states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseProgress, setParseProgress] = useState<string>('');
  const [uploadSubject, setUploadSubject] = useState<Subject>('Tư duy Toán học');
  const [uploadTopic, setUploadTopic] = useState<string>('Đề thi ĐGNL chuyên biệt');
  const [uploadDifficulty, setUploadDifficulty] = useState<Difficulty>('Thông hiểu');
  const [uploadExamTag, setUploadExamTag] = useState<string>('ĐGNL ĐHQG TP.HCM 2026');
  const [useAiExtraction, setUseAiExtraction] = useState<boolean>(true);

  // Parsed questions preview before importing
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [extractedTextPreview, setExtractedTextPreview] = useState<string>('');
  const [uploadStats, setUploadStats] = useState<{ total: number; mode: string; fileSize?: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states for manual new or edited question
  const [formData, setFormData] = useState<Omit<Question, 'id'>>({
    subject: 'Tư duy Toán học',
    topic: 'Hàm số & Khảo sát đồ thị',
    difficulty: 'Thông hiểu',
    type: 'Trắc nghiệm 4 phương án',
    content: '',
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' },
    ],
    correctAnswer: 'A',
    hint1: '',
    explanation: '',
    tip60s: '',
    examTag: 'ĐGNL ĐHQG TP.HCM',
  });

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || q.subject === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const openAddModal = () => {
    setEditingQuestion(null);
    setFormData({
      subject: 'Tư duy Toán học',
      topic: '',
      difficulty: 'Thông hiểu',
      type: 'Trắc nghiệm 4 phương án',
      content: '',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ],
      correctAnswer: 'A',
      hint1: '',
      explanation: '',
      tip60s: '',
      examTag: 'ĐGNL ĐHQG TP.HCM',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormData({
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      content: q.content,
      options: q.options,
      correctAnswer: q.correctAnswer,
      hint1: q.hint1,
      explanation: q.explanation,
      tip60s: q.tip60s,
      examTag: q.examTag || 'ĐGNL ĐHQG TP.HCM',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, formData);
    } else {
      addQuestion(formData);
    }
    setIsAddModalOpen(false);
  };

  // Export questions to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'Ngan_hang_cau_hoi_DGNL.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const validExtensions = ['.doc', '.docx', '.pdf', '.json', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setImportStatusMessage('Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp .doc, .docx, .pdf, .json hoặc .txt.');
      setImportStatusType('error');
      return;
    }

    setSelectedFile(file);
    setImportStatusMessage(null);
    setParsedQuestions([]);
    setUploadStats(null);
  };

  // Process Document Upload via Server Endpoint
  const handleProcessDocument = async () => {
    if (!selectedFile) return;

    setIsParsing(true);
    setParseProgress('Đang tải tệp lên và giải nén dữ liệu văn bản...');
    setImportStatusMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('defaultSubject', uploadSubject);
      formDataToSend.append('defaultTopic', uploadTopic);
      formDataToSend.append('defaultDifficulty', uploadDifficulty);
      formDataToSend.append('examTag', uploadExamTag);
      formDataToSend.append('useAi', String(useAiExtraction));

      setParseProgress(
        useAiExtraction
          ? 'Đang kích hoạt AI Gemini thẩm định đề thi, nhận diện câu hỏi, gợi ý logic & mẹo 60s...'
          : 'Đang bóc tách câu hỏi, phương án A/B/C/D và đáp án từ cấu trúc đề...'
      );

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi xử lý tệp');
      }

      if (data.questions && data.questions.length > 0) {
        setParsedQuestions(data.questions);
        setSelectedQuestionIds(data.questions.map((q: Question) => q.id));
        setExtractedTextPreview(data.extractedTextPreview || '');
        setUploadStats({
          total: data.questions.length,
          mode: data.stats?.mode || 'heuristic',
          fileSize: data.fileSize,
        });

        setImportStatusMessage(
          `Đã bóc tách thành công ${data.questions.length} câu hỏi từ tệp "${data.fileName}"! Vui lòng xem trước và chọn câu hỏi để thêm vào ngân hàng.`
        );
        setImportStatusType('success');
      } else {
        setImportStatusMessage('Không tìm thấy câu hỏi trắc nghiệm hợp lệ nào trong tệp. Hãy kiểm tra lại cấu trúc đề thi.');
        setImportStatusType('error');
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setImportStatusMessage(err.message || 'Lỗi khi xử lý tệp tải lên');
      setImportStatusType('error');
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  // Confirm adding selected parsed questions to question bank
  const handleConfirmImportParsedQuestions = () => {
    const questionsToAdd = parsedQuestions.filter((q) => selectedQuestionIds.includes(q.id));
    if (questionsToAdd.length === 0) {
      setImportStatusMessage('Vui lòng chọn ít nhất một câu hỏi để thêm vào ngân hàng.');
      setImportStatusType('error');
      return;
    }

    importQuestions(questionsToAdd);
    setImportStatusMessage(`Đã thêm thành công ${questionsToAdd.length} câu hỏi vào Ngân Hàng Câu Hỏi!`);
    setImportStatusType('success');

    setTimeout(() => {
      setIsImportModalOpen(false);
      setSelectedFile(null);
      setParsedQuestions([]);
      setImportStatusMessage(null);
    }, 1500);
  };

  // Toggle single question selection in preview
  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle all questions selection
  const toggleSelectAll = () => {
    if (selectedQuestionIds.length === parsedQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(parsedQuestions.map((q) => q.id));
    }
  };

  // Handle JSON Import Tab
  const handleImportSubmit = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        importQuestions(parsed);
        setImportStatusMessage(`Đã nhập thành công ${parsed.length} câu hỏi mới vào ngân hàng!`);
        setImportStatusType('success');
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportJsonText('');
          setImportStatusMessage(null);
        }, 1500);
      } else {
        setImportStatusMessage('Dữ liệu JSON phải là mảng chứa danh sách các câu hỏi.');
        setImportStatusType('error');
      }
    } catch (e: any) {
      setImportStatusMessage(`Lỗi cú pháp JSON: ${e.message}`);
      setImportStatusType('error');
    }
  };

  // Load a demo exam paper for instant testing
  const handleLoadDemoExam = () => {
    const sampleExamText = `ĐỀ THI THỬ ĐÁNH GIÁ NĂNG LỰC CHUYÊN BIỆT - MÔN TƯ DUY TOÁN HỌC & LOGIC
Thời gian: 60 phút - Năm 2026

Câu 1: Cho hàm số y = f(x) có đồ thị như hình vẽ. Số điểm cực trị của hàm số g(x) = f(x^2 - 2x) là:
A. 3
B. 5
C. 7
D. 9
Đáp án: B
Lời giải: Đặt u = x^2 - 2x, ta có u' = 2x - 2 = 0 khi x = 1. Khi u đi qua các điểm cực trị của f(u), ta xét số nghiệm phân biệt của u = c_i với u >= -1, từ đó suy ra hàm số g(x) có đúng 5 điểm cực trị.
HDG: Dùng công thức đạo hàm hàm hợp g'(x) = (2x - 2).f'(x^2 - 2x).

Câu 2: Một nhóm 5 học sinh gồm 3 nam và 2 nữ xếp thành một hàng ngang. Xác suất để hai học sinh nữ không đứng cạnh nhau là:
A. 2/5
B. 3/5
C. 1/2
D. 3/10
Đáp án: B
Lời giải: Xếp 3 bạn nam có 3! = 6 cách, tạo ra 4 vách ngăn (khoảng trống). Xếp 2 bạn nữ vào 4 vách ngăn có A(4, 2) = 12 cách. Tổng số cách thuận lợi là 6 * 12 = 72. Số phần tử không gian mẫu là 5! = 120. Xác suất P = 72/120 = 3/5.

Câu 3: Trong một hội nghị có 10 đại biểu bắt tay nhau đôi một đúng một lần. Hỏi có tất cả bao nhiêu cái bắt tay?
A. 45
B. 90
C. 100
D. 20
Đáp án: A
Lời giải: Mỗi cái bắt tay là một tổ hợp chập 2 của 10 phần tử: C(10, 2) = (10 * 9) / 2 = 45 cái bắt tay.

Câu 4: Cho đoạn mạch RLC nối tiếp, biết R = 50 Ohm, cuộn cảm thuần L = 1/pi H và tụ điện C = 10^-4/(2pi) F. Đặt vào hai đầu mạch điện áp u = 100 căn 2 cos(100 pi t) (V). Tổng trở của toàn mạch là:
A. 50 Ohm
B. 50 căn 2 Ohm
C. 100 Ohm
D. 150 Ohm
Đáp án: B
Lời giải: Cảm kháng ZL = omega * L = 100 Ohm. Dung kháng ZC = 1 / (omega * C) = 50 Ohm. Tổng trở Z = căn(R^2 + (ZL - ZC)^2) = căn(50^2 + (100 - 50)^2) = 50 căn 2 Ohm.`;

    const blob = new Blob([sampleExamText], { type: 'text/plain;charset=utf-8' });
    const file = new File([blob], 'De_Thi_Thu_DGNL_Chuan_2026.txt', { type: 'text/plain' });
    setSelectedFile(file);
    setImportStatusMessage('Đã nạp tệp đề thi mẫu (.txt/doc)! Nhấn "Bắt đầu bóc tách & Chuyển đổi" bên dưới để trải nghiệm.');
    setImportStatusType('info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Quản Lý Ngân Hàng Câu Hỏi ĐGNL Chuyên Biệt
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
              {questions.length} câu hỏi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hỗ trợ tải lên trực tiếp đề thi từ Word (.doc, .docx), PDF (.pdf) hoặc JSON với thuật toán AI tự động bóc tách.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Upload / Import Button */}
          <button
            onClick={() => {
              setIsImportModalOpen(true);
              setActiveImportTab('upload');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
          >
            <UploadCloud className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Tải lên Đề thi (.doc, .docx, .pdf)</span>
            <span className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold border border-indigo-200 dark:border-indigo-700">
              <FileText className="h-3 w-3 text-blue-500" /> DOCX/PDF
            </span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Xuất dữ liệu ngân hàng ra JSON"
          >
            <Download className="h-4 w-4" />
            Xuất file
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/25 transition-all flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Thêm câu hỏi mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm nội dung, chuyên đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-56 text-slate-900 dark:text-slate-100"
            />
          </div>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">Tất cả môn thi</option>
            <option value="Tư duy Toán học">Tư duy Toán học</option>
            <option value="Tư duy Logic & Xử lý số liệu">Tư duy Logic & Xử lý số liệu</option>
            <option value="Vật lý Chuyên biệt">Vật lý Chuyên biệt</option>
            <option value="Hóa học Chuyên biệt">Hóa học Chuyên biệt</option>
            <option value="Sinh học Chuyên biệt">Sinh học Chuyên biệt</option>
            <option value="Ngôn ngữ Tiếng Việt">Ngôn ngữ Tiếng Việt</option>
            <option value="Tiếng Anh ĐGNL">Tiếng Anh ĐGNL</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">Tất cả độ khó</option>
            <option value="Nhận biết">Nhận biết</option>
            <option value="Thông hiểu">Thông hiểu</option>
            <option value="Vận dụng">Vận dụng</option>
            <option value="Vận dụng cao">Vận dụng cao</option>
          </select>
        </div>

        <span className="text-xs text-slate-500">
          Hiển thị: <strong>{filteredQuestions.length}</strong> / {questions.length} câu
        </span>
      </div>

      {/* Question List Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredQuestions.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
                  {q.subject}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {q.topic}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                    q.difficulty === 'Vận dụng cao'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : q.difficulty === 'Vận dụng'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {q.difficulty}
                </span>
                {q.examTag && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium">
                    {q.examTag}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(q)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Chỉnh sửa câu hỏi"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Thầy/Cô có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?')) {
                      deleteQuestion(q.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content text */}
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {q.content}
            </p>

            {/* 4 Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {q.options.map((opt) => (
                <div
                  key={opt.key}
                  className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                    opt.key === q.correctAnswer
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-100 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      opt.key === q.correctAnswer
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.key}
                  </span>
                  <span>{opt.text}</span>
                </div>
              ))}
            </div>

            {/* Hint 1 and 60s Tip pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 text-amber-900 dark:text-amber-300">
                <span className="font-bold flex items-center gap-1 mb-0.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                  Gợi ý logic sai lần 1:
                </span>
                <span>{q.hint1}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 text-indigo-900 dark:text-indigo-300">
                <span className="font-bold flex items-center gap-1 mb-0.5">
                  <Zap className="h-3.5 w-3.5 text-indigo-600" />
                  Mẹo tư duy 60 giây:
                </span>
                <span>{q.tip60s}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* UPGRADED DOCUMENT UPLOAD & IMPORT MODAL (.DOC, .DOCX, .PDF, .JSON)       */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-6 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-indigo-600" />
                  Tải Lên & Bóc Tách Đề Thi Vào Ngân Hàng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hỗ trợ định dạng Word (.doc, .docx), Acrobat Reader (.pdf), văn bản (.txt) và JSON.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedQuestions([]);
                  setSelectedFile(null);
                  setImportStatusMessage(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button
                onClick={() => setActiveImportTab('upload')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeImportTab === 'upload'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Tải lên tệp (.DOC, .DOCX, .PDF)
              </button>
              <button
                onClick={() => setActiveImportTab('json')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeImportTab === 'json'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                Nhập thủ công (JSON)
              </button>
            </div>

            {/* Modal Body Container with Scroll */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {activeImportTab === 'upload' ? (
                <>
                  {/* Step 1: Upload Zone if no questions parsed yet */}
                  {parsedQuestions.length === 0 ? (
                    <div className="space-y-4">
                      {/* Drag & drop dropzone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                          isDragging
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[0.99]'
                            : selectedFile
                            ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/60 dark:bg-slate-800/40'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".doc,.docx,.pdf,.json,.txt"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        {selectedFile ? (
                          <div className="space-y-2 flex flex-col items-center">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                              <FileCheck className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {selectedFile.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {(selectedFile.size / 1024).toFixed(1)} KB • Định dạng:{' '}
                                <span className="uppercase font-mono font-bold text-indigo-600">
                                  {selectedFile.name.split('.').pop()}
                                </span>
                              </p>
                            </div>
                            <span className="text-[10px] text-indigo-600 hover:underline">
                              Nhấn để chọn tệp khác
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2 flex flex-col items-center">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                              <UploadCloud className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                Kéo & thả tệp đề thi vào đây, hoặc click để duyệt từ máy tính
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Hỗ trợ: Microsoft Word (<strong>.docx</strong>, <strong>.doc</strong>), Adobe PDF (<strong>.pdf</strong>), Text (<strong>.txt</strong>)
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                                .DOCX
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                                .DOC
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                                .PDF
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                .JSON
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick demo exam loader button */}
                      <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>Chưa có tệp sẵn trên máy? Bạn có thể nạp tệp đề thi mẫu chuẩn ĐGNL để kiểm tra ngay:</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleLoadDemoExam}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-[11px] font-bold text-slate-800 dark:text-slate-200 transition-colors shrink-0 shadow-2xs"
                        >
                          Nạp tệp đề mẫu (4 câu)
                        </button>
                      </div>

                      {/* Configuration for uploaded questions */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-indigo-500" />
                          Thiết lập siêu dữ liệu đề thi:
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Môn thi mặc định (nếu chưa ghi trong đề)
                            </label>
                            <select
                              value={uploadSubject}
                              onChange={(e) => setUploadSubject(e.target.value as any)}
                              className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                            >
                              <option value="Tư duy Toán học">Tư duy Toán học</option>
                              <option value="Tư duy Logic & Xử lý số liệu">Tư duy Logic & Xử lý số liệu</option>
                              <option value="Vật lý Chuyên biệt">Vật lý Chuyên biệt</option>
                              <option value="Hóa học Chuyên biệt">Hóa học Chuyên biệt</option>
                              <option value="Sinh học Chuyên biệt">Sinh học Chuyên biệt</option>
                              <option value="Ngôn ngữ Tiếng Việt">Ngôn ngữ Tiếng Việt</option>
                              <option value="Tiếng Anh ĐGNL">Tiếng Anh ĐGNL</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Chuyên đề / Dạng bài
                            </label>
                            <input
                              type="text"
                              value={uploadTopic}
                              onChange={(e) => setUploadTopic(e.target.value)}
                              placeholder="VD: Khảo sát đồ thị, Sóng ánh sáng..."
                              className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Mức độ khó dự kiến
                            </label>
                            <select
                              value={uploadDifficulty}
                              onChange={(e) => setUploadDifficulty(e.target.value as any)}
                              className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                            >
                              <option value="Nhận biết">Nhận biết</option>
                              <option value="Thông hiểu">Thông hiểu</option>
                              <option value="Vận dụng">Vận dụng</option>
                              <option value="Vận dụng cao">Vận dụng cao</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Nhãn kỳ thi (Tag)
                            </label>
                            <input
                              type="text"
                              value={uploadExamTag}
                              onChange={(e) => setUploadExamTag(e.target.value)}
                              placeholder="VD: ĐGNL ĐHQG TP.HCM 2026, HSA Hà Nội..."
                              className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                            />
                          </div>
                        </div>

                        {/* AI Extraction Checkbox */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            id="useAiExtraction"
                            checked={useAiExtraction}
                            onChange={(e) => setUseAiExtraction(e.target.checked)}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <label htmlFor="useAiExtraction" className="text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5" />
                              Kích hoạt AI Gemini phân tích chuyên sâu
                            </span>
                            <span className="block text-[11px] text-slate-500 mt-0.5">
                              Tự động bóc tách các câu hỏi phức tạp, tự tạo "Gợi ý logic sai lần 1" và "Mẹo tư duy 60 giây" chuẩn sư phạm nếu đề chưa có.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Step 2: Preview Parsed Questions */
                    <div className="space-y-4">
                      {/* Summary Banner */}
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-base">
                            ✓
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                              Đã bóc tách thành công {parsedQuestions.length} câu hỏi!
                            </h4>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300">
                              Từ tệp: <strong>{selectedFile?.name}</strong> • Chế độ:{' '}
                              <span className="font-mono uppercase font-bold">
                                {uploadStats?.mode === 'gemini_ai' ? 'Trí tuệ nhân tạo Gemini' : 'Bóc tách đề thi tự động'}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                          >
                            {selectedQuestionIds.length === parsedQuestions.length ? (
                              <>
                                <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                                Bỏ chọn tất cả
                              </>
                            ) : (
                              <>
                                <Square className="h-3.5 w-3.5 text-slate-400" />
                                Chọn tất cả ({parsedQuestions.length})
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setParsedQuestions([]);
                              setUploadStats(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                          >
                            Đổi tệp khác
                          </button>
                        </div>
                      </div>

                      {/* Parsed question items */}
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {parsedQuestions.map((q, idx) => {
                          const isSelected = selectedQuestionIds.includes(q.id);

                          return (
                            <div
                              key={q.id}
                              onClick={() => toggleQuestionSelection(q.id)}
                              className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all space-y-2 ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100 bg-white dark:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="rounded text-indigo-600 h-4 w-4"
                                  />
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    Câu #{idx + 1}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                    {q.subject}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {q.topic}
                                  </span>
                                </div>

                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  Đáp án: {q.correctAnswer}
                                </span>
                              </div>

                              <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                {q.content}
                              </p>

                              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                {q.options.map((opt) => (
                                  <div
                                    key={opt.key}
                                    className={`p-1.5 rounded-lg border ${
                                      opt.key === q.correctAnswer
                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-800 dark:text-emerald-200 font-semibold'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    <span className="font-bold mr-1">{opt.key}.</span> {opt.text}
                                  </div>
                                ))}
                              </div>

                              {q.hint1 && (
                                <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded-lg">
                                  <Lightbulb className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{q.hint1}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Tab 2: Manual JSON Import */
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Dán mảng JSON chứa các câu hỏi theo cấu trúc chuẩn (gồm content, options, correctAnswer, hint1, explanation, tip60s, subject, topic, difficulty).
                  </p>

                  <textarea
                    rows={10}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder='[ { "content": "Câu hỏi...", "options": [{"key":"A","text":"..."},...], "correctAnswer":"A", "hint1":"...", "explanation":"...", "tip60s":"..." } ]'
                    className="w-full p-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Status or Progress Feedback */}
              {isParsing && (
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-indigo-600 animate-spin shrink-0" />
                  <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    {parseProgress}
                  </span>
                </div>
              )}

              {importStatusMessage && !isParsing && (
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                    importStatusType === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                      : importStatusType === 'error'
                      ? 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200'
                  }`}
                >
                  {importStatusType === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{importStatusMessage}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedQuestions([]);
                  setSelectedFile(null);
                  setImportStatusMessage(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>

              {activeImportTab === 'upload' ? (
                parsedQuestions.length === 0 ? (
                  <button
                    type="button"
                    disabled={!selectedFile || isParsing}
                    onClick={handleProcessDocument}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-indigo-500/25"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Bắt đầu bóc tách & Chuyển đổi ({selectedFile?.name ? selectedFile.name.split('.').pop()?.toUpperCase() : 'DOC/PDF'})
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmImportParsedQuestions}
                    disabled={selectedQuestionIds.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-emerald-500/25"
                  >
                    <Check className="h-4 w-4" />
                    Thêm {selectedQuestionIds.length} câu đã chọn vào Ngân Hàng
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  Xác nhận Import JSON
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới Vào Ngân Hàng'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Môn thi
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Tư duy Toán học">Tư duy Toán học</option>
                    <option value="Tư duy Logic & Xử lý số liệu">Tư duy Logic & Xử lý số liệu</option>
                    <option value="Vật lý Chuyên biệt">Vật lý Chuyên biệt</option>
                    <option value="Hóa học Chuyên biệt">Hóa học Chuyên biệt</option>
                    <option value="Sinh học Chuyên biệt">Sinh học Chuyên biệt</option>
                    <option value="Ngôn ngữ Tiếng Việt">Ngôn ngữ Tiếng Việt</option>
                    <option value="Tiếng Anh ĐGNL">Tiếng Anh ĐGNL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chuyên đề / Dạng bài
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cực trị hàm số, Sóng cơ..."
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mức độ khó
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Thông hiểu">Thông hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                    <option value="Vận dụng cao">Vận dụng cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung câu hỏi
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập nội dung câu hỏi bài thi ĐGNL..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  4 Phương án lựa chọn & Chọn đáp án đúng
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {formData.options.map((opt, i) => (
                    <div key={opt.key} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, correctAnswer: opt.key })}
                        className={`h-7 w-7 rounded-lg font-bold shrink-0 text-xs ${
                          formData.correctAnswer === opt.key
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700'
                        }`}
                      >
                        {opt.key}
                      </button>
                      <input
                        type="text"
                        required
                        placeholder={`Phương án ${opt.key}...`}
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...formData.options];
                          newOpts[i].text = e.target.value;
                          setFormData({ ...formData, options: newOpts });
                        }}
                        className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Gợi ý logic sai lần 1 */}
              <div>
                <label className="block font-semibold text-amber-700 dark:text-amber-400 mb-1">
                  💡 Gợi ý logic / công thức (chỉ hiện khi học sinh trả lời SAI LẦN 1 - KHÔNG lộ đáp án)
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hãy áp dụng định luật phản đảo hoặc sử dụng biến cố đối..."
                  value={formData.hint1}
                  onChange={(e) => setFormData({ ...formData, hint1: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Giải thích chi tiết */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lời giải thích súc tích (hiện khi sai lần 2)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Các bước giải cụ thể, lý do đáp án đúng..."
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Mẹo tư duy 60s */}
              <div>
                <label className="block font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
                  ⚡ Mẹo tư duy 60 giây (thủ thuật thi nhanh, nhận diện bẫy, loại trừ)
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thấy từ ít nhất 1 dùng biến cố đối, nhẩm trong 10s..."
                  value={formData.tip60s}
                  onChange={(e) => setFormData({ ...formData, tip60s: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm shadow-indigo-500/25"
                >
                  {editingQuestion ? 'Lưu cập nhật' : 'Thêm vào ngân hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

