import { GoogleGenAI, Type } from "@google/genai";
import type { Question, PracticeQuestion, KnowledgePoint } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export async function extractQuestionsFromImage(base64ImageData: string): Promise<Question[]> {
  const model = 'gemini-2.5-flash';
  
  const textPart = {
    text: `你是一位经验丰富的中国高中老师。请仔细分析这张图片中的试卷。识别出所有标记为错误的题目（通常有红叉或圈）。将这些错题提取出来，并以JSON数组的格式返回。每个对象应包含 'subject' (例如 '数学', '物理', '语文') 和 'questionText' (完整的题目文本，包括选项)。对于题目中的数学或物理公式，请使用 LaTeX 格式（例如 $ax^2+bx+c=0$ 或 $$ \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a} $$）。请忽略图片中的其他内容，只关注错题。如果图片中没有明显的错题，请返回一个空数组。`
  };

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64ImageData,
    },
  };
  
  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: [textPart, imagePart] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            questionText: { type: Type.STRING },
          },
          required: ['subject', 'questionText'],
        },
      },
    },
  });

  const jsonString = response.text.trim();
  const parsedResponse = JSON.parse(jsonString);
  
  if (Array.isArray(parsedResponse)) {
    return parsedResponse.map((q: any) => ({
      id: generateId(),
      subject: q.subject || '未知科目',
      questionText: q.questionText || '无法识别的题目',
    }));
  }
  
  return [];
}

export async function analyzeKnowledgePoints(questions: Question[]): Promise<KnowledgePoint[]> {
  const model = 'gemini-2.5-pro';
  const promptContent = questions.map(q => 
    `{ "id": "${q.id}", "subject": "${q.subject}", "questionText": "${q.questionText.replace(/"/g, '\\"')}" }`
  ).join(',\n');
  
  const prompt = `你是一位资深的教学分析专家。这里有一系列学生做错的高中题目 (JSON格式):
[
${promptContent}
]

请仔细分析这些题目，识别出学生薄弱的核心知识点。然后，以JSON数组的格式返回你的分析结果。
每个数组中的对象代表一个独立的知识点，并遵循以下 TypeScript 接口：
interface KnowledgePoint {
  title: string; // 知识点的名称, e.g., "函数单调性与极值"
  description: string; // 对该知识点掌握不足的详细分析和具体学习建议
  relevantQuestionIds: string[]; // 与此知识点相关的原始题目ID数组
}

请确保你的回答是严格的JSON格式，不包含任何额外的解释或Markdown标记。`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            relevantQuestionIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['title', 'description', 'relevantQuestionIds'],
        },
      },
    },
  });

  const jsonString = response.text.trim();
  try {
    const parsedResponse = JSON.parse(jsonString);
    if (Array.isArray(parsedResponse)) {
      return parsedResponse as KnowledgePoint[];
    }
  } catch (e) {
    console.error("Failed to parse analysis response:", e);
    return [{
        title: "分析失败",
        description: "抱歉，AI无法解析错题并生成知识点分析。请检查题目是否完整，然后重试。",
        relevantQuestionIds: questions.map(q => q.id)
    }];
  }
  return [];
}


export async function generatePracticeTest(analysisResult: KnowledgePoint[]): Promise<PracticeQuestion[]> {
  const model = 'gemini-2.5-pro';
  const analysisText = analysisResult.map(kp => `- ${kp.title}: ${kp.description}`).join('\n');

  const prompt = `你是一位出题专家。根据以下这份复习提纲，请为一名高中生出一套包含3-5道题目的新练习题，旨在巩固这些薄弱的知识点。为每道题提供详细的步骤和解析。
对于题目和答案中的所有数学或物理公式，请务必使用 LaTeX 格式（例如 $E=mc^2$ 或 $$y = \\sin(x)$$）。
请以JSON数组的格式返回。每个对象应包含 'questionText' (题目) 和 'answerText' (详解答案)。

复习提纲:
${analysisText}`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionText: { type: Type.STRING },
            answerText: { type: Type.STRING },
          },
          required: ['questionText', 'answerText'],
        },
      },
    },
  });

  const jsonString = response.text.trim();
  const parsedResponse = JSON.parse(jsonString);
  
  if (Array.isArray(parsedResponse)) {
    return parsedResponse.map((q: any) => ({
      id: generateId(),
      questionText: q.questionText || '无法生成的题目',
      answerText: q.answerText || '无法生成的答案',
    }));
  }
  
  return [];
}
