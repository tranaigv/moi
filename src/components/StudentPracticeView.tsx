import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Zap,
  Filter,
  BrainCircuit,
  Award,
  ChevronRight,
  Flame,
  Volume2,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Question, Subject, Difficulty } from '../types';
import { playSuccessSound, playHintSound, playWrongSound } from '../utils/audioFeedback';

export const StudentPracticeView: React.FC = () => {
  const {
    questions,
    logAnswer,
    currentStudent,
    toggleSaveQuestion,
    isQuestionSaved,
    soundEnabled,
  } = useApp();

  // Mode filters
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [practiceMode, setPracticeMode] = useState<'standard' | 'timed' | 'wrong_review'>('standard');
  const [isSpeedTimerEnabled, setIsSpeedTimerEnabled] = useState<boolean>(true);

  // Filtered pool
  const candidateQuestions = useMemo(() => {
    let pool = [...questions];
    if (practiceMode === 'wrong_review') {
      pool = pool.filter((q) => currentStudent.wrongQuestionIds.includes(q.id));
      if (pool.length === 0) {
        // Fallback if no wrong questions
        pool = [...questions];
      }
    }
    if (selectedSubject !== 'all') {
      pool = pool.filter((q) => q.subject === selectedSubject);
    }
    if (selectedDifficulty !== 'all') {
      pool = pool.filter((q) => q.difficulty === selectedDifficulty);
    }
    return pool;
  }, [questions, selectedSubject, selectedDifficulty, practiceMode, currentStudent.wrongQuestionIds]);

  // Current session states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  // Answering states
  // attempts: 0 (not attempted), 1 (wrong first time, can retry), 2 (done: either correct or wrong twice)
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [firstSelectedKey, setFirstSelectedKey] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [secondSelectedKey, setSecondSelectedKey] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isResolved, setIsResolved] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  // Timers
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [timedCountdown, setTimedCountdown] = useState<number>(15 * 60); // 15 mins for timed mode
  const [isSessionActive, setIsSessionActive] = useState<boolean>(true);

  // Dynamic AI hint & 60s tip loading
  const [aiTipLoading, setAiTipLoading] = useState<boolean>(false);
  const [aiTipContent, setAiTipContent] = useState<string | null>(null);
  const [aiDeepDiveLoading, setAiDeepDiveLoading] = useState<boolean>(false);
  const [aiDeepDiveContent, setAiDeepDiveContent] = useState<string | null>(null);

  // Statistics in current practice session
  const [sessionStats, setSessionStats] = useState({
    totalCompleted: 0,
    firstTryCorrect: 0,
    secondTryCorrect: 0,
    wrongCount: 0,
  });

  // Pick question function
  const pickNextQuestion = (filterPool = candidateQuestions) => {
    if (filterPool.length === 0) {
      setCurrentQuestion(null);
      return;
    }
    // Random pick or sequential
    const randomIndex = Math.floor(Math.random() * filterPool.length);
    setCurrentQuestion(filterPool[randomIndex]);
    setAttemptCount(0);
    setFirstSelectedKey(null);
    setSecondSelectedKey(null);
    setIsResolved(false);
    setIsCorrect(false);
    setSecondsElapsed(0);
    setAiTipContent(null);
    setAiDeepDiveContent(null);
  };

  // Initialize first question
  useEffect(() => {
    if (!currentQuestion && candidateQuestions.length > 0) {
      pickNextQuestion(candidateQuestions);
    }
  }, [candidateQuestions]);

  // Per-question stopwatch
  useEffect(() => {
    if (!isResolved && isSessionActive) {
      const interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isResolved, isSessionActive]);

  // Mini-exam countdown timer (if timed mode)
  useEffect(() => {
    if (practiceMode === 'timed' && isSessionActive && timedCountdown > 0) {
      const interval = setInterval(() => {
        setTimedCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [practiceMode, isSessionActive, timedCountdown]);

  // Core conditional response logic (Strict prompt rule:
  // - Đúng: khen ngắn + mẹo tư duy 60 giây.
  // - Sai lần 1: chỉ đưa 1 câu gợi ý logic/công thức, cho chọn lại.
  // - Sai lần 2: hiện đáp án đúng + giải thích ngắn + mẹo.
  // - Sau mỗi câu: hỏi “Em sẵn sàng sang câu tiếp theo chưa?”)
  const handleSelectOption = async (optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion || isResolved) return;

    if (attemptCount === 0) {
      // First attempt
      setFirstSelectedKey(optionKey);
      if (optionKey === currentQuestion.correctAnswer) {
        // CORRECT FIRST TRY!
        if (soundEnabled) playSuccessSound();
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        } catch (e) {}

        setAttemptCount(1);
        setIsCorrect(true);
        setIsResolved(true);

        setSessionStats((prev) => ({
          ...prev,
          totalCompleted: prev.totalCompleted + 1,
          firstTryCorrect: prev.firstTryCorrect + 1,
        }));

        logAnswer({
          questionId: currentQuestion.id,
          studentId: currentStudent.id,
          firstAttemptAnswer: optionKey,
          finalAnswer: optionKey,
          isFirstAttemptCorrect: true,
          isSecondAttemptCorrect: false,
          timeSpentSec: secondsElapsed,
          hintUsed: false,
          subject: currentQuestion.subject,
          topic: currentQuestion.topic,
          difficulty: currentQuestion.difficulty,
        });
      } else {
        // WRONG ATTEMPT 1!
        if (soundEnabled) playHintSound();
        setAttemptCount(1);
        setIsCorrect(false);
        // Do NOT resolve yet! Show Hint 1 and allow second attempt.
      }
    } else if (attemptCount === 1) {
      // Second attempt
      setSecondSelectedKey(optionKey);
      if (optionKey === currentQuestion.correctAnswer) {
        // CORRECT SECOND TRY!
        if (soundEnabled) playSuccessSound();
        setAttemptCount(2);
        setIsCorrect(true);
        setIsResolved(true);

        setSessionStats((prev) => ({
          ...prev,
          totalCompleted: prev.totalCompleted + 1,
          secondTryCorrect: prev.secondTryCorrect + 1,
        }));

        logAnswer({
          questionId: currentQuestion.id,
          studentId: currentStudent.id,
          firstAttemptAnswer: firstSelectedKey || undefined,
          secondAttemptAnswer: optionKey,
          finalAnswer: optionKey,
          isFirstAttemptCorrect: false,
          isSecondAttemptCorrect: true,
          timeSpentSec: secondsElapsed,
          hintUsed: true,
          subject: currentQuestion.subject,
          topic: currentQuestion.topic,
          difficulty: currentQuestion.difficulty,
        });
      } else {
        // WRONG SECOND TRY!
        if (soundEnabled) playWrongSound();
        setAttemptCount(2);
        setIsCorrect(false);
        setIsResolved(true);

        setSessionStats((prev) => ({
          ...prev,
          totalCompleted: prev.totalCompleted + 1,
          wrongCount: prev.wrongCount + 1,
        }));

        logAnswer({
          questionId: currentQuestion.id,
          studentId: currentStudent.id,
          firstAttemptAnswer: firstSelectedKey || undefined,
          secondAttemptAnswer: optionKey,
          finalAnswer: optionKey,
          isFirstAttemptCorrect: false,
          isSecondAttemptCorrect: false,
          timeSpentSec: secondsElapsed,
          hintUsed: true,
          subject: currentQuestion.subject,
          topic: currentQuestion.topic,
          difficulty: currentQuestion.difficulty,
        });
      }
    }
  };

  // AI Gemini dynamic hint/tip fetcher
  const fetchGeminiTip = async () => {
    if (!currentQuestion || aiTipLoading) return;
    setAiTipLoading(true);
    try {
      const res = await fetch('/api/gemini/hint-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.content,
          options: currentQuestion.options,
          subject: currentQuestion.subject,
          type: 'tip_60s',
        }),
      });
      const data = await res.json();
      setAiTipContent(data.content || currentQuestion.tip60s);
    } catch (e) {
      setAiTipContent(currentQuestion.tip60s);
    } finally {
      setAiTipLoading(false);
    }
  };

  const fetchGeminiDeepDive = async () => {
    if (!currentQuestion || aiDeepDiveLoading) return;
    setAiDeepDiveLoading(true);
    try {
      const res = await fetch('/api/gemini/hint-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.content,
          options: currentQuestion.options,
          subject: currentQuestion.subject,
          type: 'deep_dive',
        }),
      });
      const data = await res.json();
      setAiDeepDiveContent(data.content);
    } catch (e) {
      setAiDeepDiveContent('Phương án chuẩn xác được chứng minh dựa trên các định luật cốt lõi của chủ đề.');
    } finally {
      setAiDeepDiveLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Practice Header & Controls Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Mode selector */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setPracticeMode('standard');
                pickNextQuestion();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                practiceMode === 'standard'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Luyện chuẩn ngẫu nhiên
            </button>
            <button
              onClick={() => {
                setPracticeMode('wrong_review');
                pickNextQuestion();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                practiceMode === 'wrong_review'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Sổ tay câu sai ({currentStudent.wrongQuestionIds.length})
            </button>
            <button
              onClick={() => {
                setPracticeMode('timed');
                pickNextQuestion();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                practiceMode === 'timed'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Thi thử có giờ (15 phút)
            </button>
          </div>

          {/* Right: Live Session Counters */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            {isSpeedTimerEnabled && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                <span>{practiceMode === 'timed' ? formatTime(timedCountdown) : `${secondsElapsed}s`}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ {sessionStats.firstTryCorrect + sessionStats.secondTryCorrect}
              </span>
              <span className="text-rose-500 font-bold">✗ {sessionStats.wrongCount}</span>
              <span className="text-slate-400">|</span>
              <span>Tổng: {sessionStats.totalCompleted} câu</span>
            </div>
          </div>
        </div>

        {/* Filters Bar: Subject & Difficulty */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium mr-1">
            <Filter className="h-3.5 w-3.5" />
            Lọc môn:
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => {
              const val = e.target.value as any;
              setSelectedSubject(val);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">Tất cả các môn thi ĐGNL</option>
            <option value="Tư duy Toán học">Tư duy Toán học</option>
            <option value="Tư duy Logic & Xử lý số liệu">Tư duy Logic & Xử lý số liệu</option>
            <option value="Vật lý Chuyên biệt">Vật lý Chuyên biệt</option>
            <option value="Hóa học Chuyên biệt">Hóa học Chuyên biệt</option>
            <option value="Sinh học Chuyên biệt">Sinh học Chuyên biệt</option>
            <option value="Ngôn ngữ Tiếng Việt">Ngôn ngữ Tiếng Việt</option>
            <option value="Tiếng Anh ĐGNL">Tiếng Anh ĐGNL</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => {
              const val = e.target.value as any;
              setSelectedDifficulty(val);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">Mọi độ khó</option>
            <option value="Nhận biết">Nhận biết</option>
            <option value="Thông hiểu">Thông hiểu</option>
            <option value="Vận dụng">Vận dụng</option>
            <option value="Vận dụng cao">Vận dụng cao</option>
          </select>

          <button
            onClick={() => pickNextQuestion()}
            className="ml-auto text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Đổi câu khác
          </button>
        </div>
      </div>

      {/* Main Question Practice Card */}
      {!currentQuestion ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Không tìm thấy câu hỏi phù hợp bộ lọc
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Hãy điều chỉnh lại môn học hoặc độ khó để tiếp tục luyện tập ngân hàng câu hỏi ĐGNL.
          </p>
          <button
            onClick={() => {
              setSelectedSubject('all');
              setSelectedDifficulty('all');
              setPracticeMode('standard');
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all space-y-6">
          {/* Question Metadata Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                {currentQuestion.subject}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {currentQuestion.topic}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  currentQuestion.difficulty === 'Vận dụng cao'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : currentQuestion.difficulty === 'Vận dụng'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {currentQuestion.difficulty}
              </span>
              {currentQuestion.examTag && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800">
                  {currentQuestion.examTag}
                </span>
              )}
            </div>

            {/* Bookmark button */}
            <button
              onClick={() => toggleSaveQuestion(currentQuestion.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isQuestionSaved(currentQuestion.id)
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isQuestionSaved(currentQuestion.id) ? (
                <>
                  <BookmarkCheck className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span>Đã lưu vào sổ tay</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  <span>Lưu câu này</span>
                </>
              )}
            </button>
          </div>

          {/* Question Content */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-medium leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-line">
              {currentQuestion.content}
            </h2>
          </div>

          {/* 4 Options Grid (A, B, C, D) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {currentQuestion.options.map((opt) => {
              const isSelectedFirst = firstSelectedKey === opt.key;
              const isSelectedSecond = secondSelectedKey === opt.key;
              const isCorrectAnswer = opt.key === currentQuestion.correctAnswer;

              let buttonStyle = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200';
              let badgeStyle = 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';

              if (isResolved) {
                // If resolved: reveal correct answer in green, and wrong selections in red
                if (isCorrectAnswer) {
                  buttonStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20';
                  badgeStyle = 'bg-emerald-600 text-white';
                } else if (isSelectedFirst || isSelectedSecond) {
                  buttonStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-800 dark:text-rose-200';
                  badgeStyle = 'bg-rose-500 text-white';
                } else {
                  buttonStyle = 'opacity-60 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500';
                }
              } else if (attemptCount === 1) {
                // Wrong after first attempt
                if (isSelectedFirst) {
                  buttonStyle = 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-200 ring-1 ring-amber-400/30';
                  badgeStyle = 'bg-amber-500 text-white';
                }
              }

              return (
                <button
                  key={opt.key}
                  disabled={isResolved || (attemptCount === 1 && isSelectedFirst)}
                  onClick={() => handleSelectOption(opt.key)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left text-sm font-medium transition-all transform active:scale-[0.99] disabled:cursor-not-allowed ${buttonStyle}`}
                >
                  <span className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${badgeStyle}`}>
                    {opt.key}
                  </span>
                  <span className="pt-0.5 leading-snug">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* ================= CONDITIONAL FEEDBACK MODULE ================= */}

          {/* 1. SAI LẦN 1: GỢI Ý TƯ DUY 1 CÂU, CHO PHÉP CHỌN LẠI */}
          {!isResolved && attemptCount === 1 && (
            <div className="mt-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <Lightbulb className="h-5 w-5 text-amber-600 animate-bounce" />
                <span>Chưa chính xác! Hãy đọc gợi ý tư duy và chọn lại nhé:</span>
              </div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200 pl-7 leading-relaxed bg-amber-100/60 dark:bg-amber-900/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-700/50">
                💡 <span className="font-semibold">Gợi ý logic:</span> {currentQuestion.hint1}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 pl-7 italic">
                (Em hãy bấm vào phương án khác ở trên để trả lời lần 2)
              </p>
            </div>
          )}

          {/* 2. ĐÚNG: KHEN NGẮN + MẸO TƯ DUY 60 GIÂY */}
          {isResolved && isCorrect && (
            <div className="mt-4 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>
                    {attemptCount === 1
                      ? 'Xuất sắc! Em đã trả lời đúng ngay lần đầu tiên! 🎉'
                      : 'Tuyệt vời! Em đã sửa sai thành công ở lần 2! 👏'}
                  </span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  +10 Điểm
                </span>
              </div>

              {/* Mẹo tư duy 60 giây */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>Mẹo tư duy thực chiến 60 giây</span>
                  </div>
                  <button
                    onClick={fetchGeminiTip}
                    disabled={aiTipLoading}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <BrainCircuit className="h-3 w-3" />
                    {aiTipLoading ? 'AI đang sinh mẹo...' : 'AI sinh mẹo mới'}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {aiTipContent || currentQuestion.tip60s}
                </p>
              </div>
            </div>
          )}

          {/* 3. SAI LẦN 2: HIỆN ĐÁP ÁN ĐÚNG + GIẢI THÍCH NGẮN + MẸO GHI NHỚ */}
          {isResolved && !isCorrect && (
            <div className="mt-4 p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm sm:text-base">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <span>
                  Chưa chính xác sau 2 lần chọn! Đáp án đúng là:{' '}
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-mono text-base">
                    {currentQuestion.correctAnswer}
                  </span>
                </span>
              </div>

              {/* Lời giải thích ngắn */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-indigo-600" />
                    Lời giải thích chi tiết:
                  </span>
                  <button
                    onClick={fetchGeminiDeepDive}
                    disabled={aiDeepDiveLoading}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <BrainCircuit className="h-3 w-3" />
                    {aiDeepDiveLoading ? 'Gemini đang phân tích...' : 'Gemini AI phân tích sâu'}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {aiDeepDiveContent || currentQuestion.explanation}
                </p>
              </div>

              {/* Mẹo tư duy */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold">Mẹo ghi nhớ: </strong>
                  {currentQuestion.tip60s}
                </span>
              </div>
            </div>
          )}

          {/* ================= TIẾP TỤC SANG CÂU TIẾP THEO ================= */}
          {isResolved && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
                <Award className="h-4 w-4 text-indigo-600" />
                <span>Em sẵn sàng sang câu tiếp theo chưa?</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    // Retry this same question
                    setAttemptCount(0);
                    setFirstSelectedKey(null);
                    setSecondSelectedKey(null);
                    setIsResolved(false);
                    setIsCorrect(false);
                    setSecondsElapsed(0);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Làm lại câu này
                </button>

                <button
                  onClick={() => pickNextQuestion()}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Tiếp tục câu tiếp theo</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
