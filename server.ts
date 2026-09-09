import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure multer for memory storage (max 25MB file upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Lazy-initialized Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Hint & Thinking Tip Generator
app.post("/api/gemini/hint-tip", async (req, res) => {
  try {
    const { question, options, subject, type, previousAnswer } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // Graceful fallback if no API key configured
      if (type === "hint_1") {
        return res.json({
          content: "Gợi ý tư duy: Hãy đọc kỹ điều kiện bài toán, loại trừ 2 phương án vô lý trước và áp dụng tính chất cốt lõi của chủ đề.",
          isFallback: true,
        });
      }
      return res.json({
        content: "Mẹo 60 giây: Chú ý phương pháp thử ngược đáp án (plug-in) hoặc đánh giá giới hạn biên để giải nhanh trong phòng thi!",
        isFallback: true,
      });
    }

    let prompt = "";
    if (type === "hint_1") {
      prompt = `Bạn là trợ lý sư phạm cho kỳ thi Đánh giá Năng lực (ĐGNL) chuyên biệt môn ${subject || "Khoa học/Tư duy"}.
Học sinh vừa chọn sai đáp án ${previousAnswer ? `(${previousAnswer})` : ""} cho câu hỏi sau:
"${question}"
Các phương án: ${JSON.stringify(options)}

YÊU CẦU QUAN TRỌNG:
- KHÔNG ĐƯỢC TIẾT LỘ ĐÁP ÁN ĐÚNG.
- Chỉ đưa đúng 1-2 CÂU GỢI Ý NGẮN GỌN (tối đa 40 từ) về tư duy logic, hướng suy luận hoặc công thức then chốt để học sinh tự chọn lại.
- Giọng điệu khích lệ, sư phạm, súc tích.`;
    } else if (type === "tip_60s") {
      prompt = `Bạn là chuyên gia luyện thi ĐGNL chuyên biệt môn ${subject || "Khoa học/Tư duy"}.
Học sinh vừa trả lời ĐÚNG câu hỏi:
"${question}"
Các phương án: ${JSON.stringify(options)}

YÊU CẦU:
- Viết 1 "Mẹo tư duy 60 giây" (tối đa 60 từ) để giúp học sinh giải dạng này siêu nhanh trong phòng thi (ví dụ: mẹo loại trừ, kỹ thuật thế số, nhận diện dấu hiệu bẫy, hoặc quy luật then chốt).
- Súc tích, thực chiến.`;
    } else {
      prompt = `Bạn là chuyên gia kỳ thi ĐGNL chuyên biệt môn ${subject || "Khoa học/Tư duy"}.
Học sinh cần giải thích chuyên sâu cho câu hỏi:
"${question}"
Các phương án: ${JSON.stringify(options)}

Hãy giải thích ngắn gọn, rõ ràng:
1. Bản chất cốt lõi
2. Vì sao phương án đúng lại chuẩn xác
3. Bẫy hay gặp ở câu này`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn là trợ lý luyện thi Đánh giá Năng lực THPT chuyên biệt chuẩn xác, sư phạm, thân thiện.",
        temperature: 0.7,
      },
    });

    const text = response.text || "Hãy suy nghĩ kỹ mối liên hệ giữa các dữ kiện đề bài.";
    res.json({ content: text.trim(), isFallback: false });
  } catch (err: any) {
    console.error("Gemini hint error:", err);
    res.json({
      content: "Gợi ý: Hãy quan sát kỹ từ khóa trọng tâm trong câu hỏi và liên hệ với các công thức cơ bản.",
      isFallback: true,
      error: err.message,
    });
  }
});

// AI Recommendation Generator for Teachers & Students
app.post("/api/gemini/recommendation", async (req, res) => {
  try {
    const { studentName, strongTopics, weakTopics, accuracyRate, targetExam } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        recommendation: `Học sinh ${studentName || "em"} cần tập trung ôn tập thêm các chuyên đề có tỷ lệ sai nhiều (${weakTopics?.join(", ") || "chuyên đề nâng cao"}). Nên dành 20 phút mỗi ngày làm lại "Sổ tay câu sai" và rèn luyện kỹ năng đọc hiểu nhanh.`,
        isFallback: true,
      });
    }

    const prompt = `Phân tích dữ liệu học sinh luyện thi ${targetExam || "ĐGNL Chuyên biệt"}:
- Tên học sinh: ${studentName || "Học sinh"}
- Điểm mạnh: ${strongTopics?.join(", ") || "Chưa xác định"}
- Điểm yếu/cần cải thiện: ${weakTopics?.join(", ") || "Một số chuyên đề vận dụng"}
- Tỷ lệ đúng hiện tại: ${accuracyRate || 65}%

Hãy đưa ra nhận xét sư phạm và 3 lời khuyên hành động cụ thể (chiến lược phân bổ thời gian, kỹ thuật giải quyết điểm yếu, bài tập trọng tâm) trong 120-150 từ, giọng văn giáo viên tận tâm, truyền cảm hứng.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({
      recommendation: (response.text || "").trim(),
      isFallback: false,
    });
  } catch (err: any) {
    console.error("Gemini recommendation error:", err);
    res.json({
      recommendation: "Cần tăng cường rèn luyện các câu hỏi ở phần tư duy logic và xử lý số liệu để tối ưu hóa điểm số.",
      isFallback: true,
    });
  }
});

// Helper to extract readable text from binary .doc (Word 97-2003) files
function extractTextFromDoc(buffer: Buffer): string {
  try {
    // Word 97-2003 stores text in UTF-16LE or ASCII/ANSI chunks
    const str16 = buffer.toString("utf16le");
    const cleaned16 = str16
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ")
      .replace(/[^\P{C}\n\r\t]/u, " ");

    const str8 = buffer.toString("utf8");
    const cleaned8 = str8
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ");

    const countWords = (s: string) => (s.match(/[\p{L}]{2,}/gu) || []).length;
    const count16 = countWords(cleaned16);
    const count8 = countWords(cleaned8);

    const best = count16 >= count8 ? cleaned16 : cleaned8;
    return best
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch (err) {
    console.error("Error extracting from .doc:", err);
    return buffer.toString("utf-8");
  }
}

// Heuristic fallback question parser for Vietnamese exams
function parseQuestionsHeuristic(
  rawText: string,
  defaultSubject?: string,
  defaultTopic?: string,
  defaultDifficulty?: string,
  examTag?: string
) {
  const clean = rawText.replace(/\r\n/g, "\n").trim();
  const questions: any[] = [];

  // Match question patterns: "Câu 1:", "Câu 1.", "Câu 1 -", "Bài 1:", "1.", "Question 1"
  const questionRegex = /(?:^|\n)\s*(?:(?:Câu|Bài|Question)\s*(\d+)[\s.:\-–]+|(\d+)\.\s+)/gi;

  const matches: { index: number; qNum: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = questionRegex.exec(clean)) !== null) {
    matches.push({
      index: m.index,
      qNum: m[1] || m[2] || `${matches.length + 1}`,
    });
  }

  let blocks: string[] = [];
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : clean.length;
      blocks.push(clean.slice(start, end).trim());
    }
  } else {
    // Fallback: split by multiple newlines
    blocks = clean.split(/\n{2,}/).filter((b) => b.trim().length > 30);
  }

  blocks.forEach((block, idx) => {
    // Extract options A, B, C, D
    const optRegex = /(?:^|\n|\s+)([A-D])[\s.:\)\-–]+\s*([^\n]+)/g;
    const foundOptions: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [];
    let optMatch: RegExpExecArray | null;
    let firstOptIndex = -1;

    while ((optMatch = optRegex.exec(block)) !== null) {
      if (firstOptIndex === -1) firstOptIndex = optMatch.index;
      foundOptions.push({
        key: optMatch[1].toUpperCase() as any,
        text: optMatch[2].trim(),
      });
    }

    let qContent = firstOptIndex > 0 ? block.slice(0, firstOptIndex).trim() : block.trim();
    qContent = qContent.replace(/^(?:Câu|Bài|Question)\s*\d+[\s.:\-–]*/i, "").trim();

    // Answer detection
    const ansMatch = block.match(/(?:Đáp án|Chọn|Đ\/a|Key|Ans|Answer)[:\s]*([A-D])/i);
    const correctAnswer = ansMatch
      ? (ansMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D')
      : foundOptions.length > 0
      ? foundOptions[0].key
      : 'A';

    // Explanation detection
    const expMatch = block.match(
      /(?:Lời giải|Hướng dẫn giải|Giải thích|HDG|Explanation)[:\s]*([\s\S]*?)(?=(?:Câu|Bài|$))/i
    );
    const explanation = expMatch
      ? expMatch[1].trim()
      : `Phân tích chuyên sâu: Đáp án đúng là ${correctAnswer}. Cần chú ý điều kiện xác định và các bước suy luận định lượng/logic then chốt.`;

    const hint1 = `Gợi ý logic: Đọc kỹ điều kiện bài toán, loại trừ 2 phương án sai trước và vận dụng tính chất cốt lõi của chủ đề.`;
    const tip60s = `Mẹo 60 giây: Dùng kỹ thuật thế ngược đáp án hoặc nhận diện dấu hiệu bẫy để tiết kiệm thời gian trong phòng thi.`;

    const finalOptions: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
      { key: 'A', text: foundOptions.find((o) => o.key === 'A')?.text || 'Phương án A' },
      { key: 'B', text: foundOptions.find((o) => o.key === 'B')?.text || 'Phương án B' },
      { key: 'C', text: foundOptions.find((o) => o.key === 'C')?.text || 'Phương án C' },
      { key: 'D', text: foundOptions.find((o) => o.key === 'D')?.text || 'Phương án D' },
    ];

    if (qContent.length > 5) {
      questions.push({
        id: `q-doc-${Date.now()}-${idx + 1}`,
        subject: defaultSubject || 'Tư duy Toán học',
        topic: defaultTopic || 'Đề thi tổng hợp',
        difficulty: defaultDifficulty || 'Thông hiểu',
        type: 'Trắc nghiệm 4 phương án',
        content: qContent,
        options: finalOptions,
        correctAnswer,
        hint1,
        explanation,
        tip60s,
        examTag: examTag || 'Đề tải lên (Doc/Docx/PDF)',
      });
    }
  });

  return questions;
}

// API: Upload and Parse Document (.doc, .docx, .pdf, .json, .txt) into Question Bank
app.post("/api/upload-document", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Không tìm thấy tệp tải lên." });
    }

    const { defaultSubject, defaultTopic, defaultDifficulty, examTag, useAi } = req.body;
    const fileName = req.file.originalname;
    const ext = path.extname(fileName).toLowerCase();
    let extractedText = "";

    console.log(`Processing file upload: ${fileName} (${ext}, ${req.file.size} bytes)`);

    // 1. Extract Text based on file extension
    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = result.value || "";
    } else if (ext === ".pdf") {
      try {
        const pdfData = await (pdfParse as any)(req.file.buffer);
        extractedText = pdfData.text || "";
      } catch (pdfErr) {
        console.error("PDF parse error:", pdfErr);
        extractedText = req.file.buffer.toString("utf-8");
      }
    } else if (ext === ".doc") {
      extractedText = extractTextFromDoc(req.file.buffer);
    } else if (ext === ".json") {
      try {
        const jsonStr = req.file.buffer.toString("utf-8");
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          return res.json({
            success: true,
            fileName,
            fileSize: req.file.size,
            fileType: ext.replace(".", ""),
            questions: parsed.map((q, idx) => ({
              ...q,
              id: q.id || `q-json-${Date.now()}-${idx}`,
            })),
            stats: {
              totalQuestions: parsed.length,
              mode: "direct_json",
            },
          });
        }
      } catch (jsonErr: any) {
        return res.status(400).json({ error: `Lỗi đọc JSON: ${jsonErr.message}` });
      }
    } else {
      // .txt or generic text
      extractedText = req.file.buffer.toString("utf-8");
    }

    if (!extractedText.trim()) {
      return res.status(400).json({
        error: "Không thể trích xuất văn bản từ tệp. Vui lòng kiểm tra định dạng tệp có chứa văn bản hoặc định dạng hợp lệ.",
      });
    }

    // 2. Parse Questions using Gemini (if enabled & configured) or Fallback Heuristic
    let parsedQuestions: any[] = [];
    let parsingMode = "heuristic";
    const ai = getGenAI();

    const shouldUseAi = useAi !== "false" && !!ai;

    if (shouldUseAi) {
      try {
        const prompt = `Bạn là chuyên gia thẩm định và số hóa đề thi Đánh giá Năng lực (ĐGNL) THPT chuyên biệt.
Dưới đây là nội dung văn bản trích xuất từ tệp đề thi (${fileName}):

--- NỘI DUNG VĂN BẢN ---
${extractedText.slice(0, 32000)}
--- HẾT VĂN BẢN ---

YÊU CẦU:
Hãy bóc tách tất cả các câu hỏi trắc nghiệm thành một mảng JSON chuẩn xác theo đúng cấu trúc:
[
  {
    "content": "Nội dung câu hỏi đầy đủ, giữ nguyên các công thức và số liệu",
    "options": [
      { "key": "A", "text": "Phương án A" },
      { "key": "B", "text": "Phương án B" },
      { "key": "C", "text": "Phương án C" },
      { "key": "D", "text": "Phương án D" }
    ],
    "correctAnswer": "A",
    "hint1": "Gợi ý tư duy logic / công thức ngắn gọn (tối đa 35 từ, TUYỆT ĐỐI KHÔNG NÓI ĐÁP ÁN ĐÚNG) để học sinh tự làm lại khi chọn sai lần 1",
    "explanation": "Lời giải thích súc tích, logic chứng minh phương án đúng",
    "tip60s": "Mẹo tư duy 60 giây (kỹ thuật giải nhanh, nhận diện bẫy, hoặc đánh giá biên)",
    "subject": "${defaultSubject || 'Tư duy Toán học'}",
    "topic": "${defaultTopic || 'Đề thi tổng hợp'}",
    "difficulty": "${defaultDifficulty || 'Thông hiểu'}",
    "type": "Trắc nghiệm 4 phương án"
  }
]

LƯU Ý QUAN TRỌNG:
1. Nếu đề bài chưa ghi rõ đáp án, hãy dùng tri thức chuyên gia để giải và gán correctAnswer chính xác (A, B, C hoặc D).
2. Tự động xác định đúng môn học nếu có thể: 'Tư duy Toán học', 'Tư duy Logic & Xử lý số liệu', 'Vật lý Chuyên biệt', 'Hóa học Chuyên biệt', 'Sinh học Chuyên biệt', 'Ngôn ngữ Tiếng Việt', 'Tiếng Anh ĐGNL'.
3. Trả về DUY NHẤT một mảng JSON hợp lệ, không kèm văn bản markdown giải thích ở ngoài.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const rawJson = response.text || "[]";
        const jsonMatch = rawJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        const jsonToParse = jsonMatch ? jsonMatch[0] : rawJson;
        const aiQuestions = JSON.parse(jsonToParse);

        if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
          parsedQuestions = aiQuestions.map((q, idx) => ({
            ...q,
            id: `q-upload-${Date.now()}-${idx + 1}`,
            examTag: examTag || `${fileName.replace(/\.[^/.]+$/, '')} (Tải lên)`,
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : [
              { key: 'A', text: q.options?.[0]?.text || 'Phương án A' },
              { key: 'B', text: q.options?.[1]?.text || 'Phương án B' },
              { key: 'C', text: q.options?.[2]?.text || 'Phương án C' },
              { key: 'D', text: q.options?.[3]?.text || 'Phương án D' },
            ],
            correctAnswer: ['A', 'B', 'C', 'D'].includes(q.correctAnswer) ? q.correctAnswer : 'A',
          }));
          parsingMode = "gemini_ai";
        }
      } catch (geminiError) {
        console.error("Gemini document parsing error, falling back to heuristic:", geminiError);
      }
    }

    // Fallback if Gemini failed or was disabled
    if (parsedQuestions.length === 0) {
      parsedQuestions = parseQuestionsHeuristic(
        extractedText,
        defaultSubject,
        defaultTopic,
        defaultDifficulty,
        examTag || `${fileName.replace(/\.[^/.]+$/, '')} (Doc/PDF)`
      );
      parsingMode = "heuristic";
    }

    return res.json({
      success: true,
      fileName,
      fileSize: req.file.size,
      fileType: ext.replace(".", "").toUpperCase(),
      extractedTextPreview: extractedText.slice(0, 500) + (extractedText.length > 500 ? "..." : ""),
      questions: parsedQuestions,
      stats: {
        totalQuestions: parsedQuestions.length,
        mode: parsingMode,
        rawTextLength: extractedText.length,
      },
    });
  } catch (err: any) {
    console.error("Upload document error:", err);
    return res.status(500).json({
      error: `Lỗi xử lý tệp: ${err.message || "Không thể phân tích tệp"}`,
    });
  }
});

// API: Upload assignment attachment file (.doc, .docx, .pdf)
app.post("/api/upload-assignment-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Không tìm thấy tệp đính kèm." });
    }

    const fileName = req.file.originalname;
    const ext = path.extname(fileName).toLowerCase().replace(".", "");
    const mimeType = req.file.mimetype || (ext === "pdf" ? "application/pdf" : "application/octet-stream");
    const base64Data = req.file.buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    res.json({
      success: true,
      fileName,
      fileSize: req.file.size,
      fileType: ext,
      dataUrl,
    });
  } catch (err: any) {
    console.error("Upload assignment file error:", err);
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
