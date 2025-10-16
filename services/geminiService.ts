
import { GoogleGenAI, Type } from "@google/genai";
import type { Question, PracticeQuestion } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export async function extractQuestionsFromImage(base64ImageData: string): Promise<Question[]> {
  const model = 'gemini-2.5-flash';
  
  const textPart = {
    text: `你是一位经验丰富的中国高中老师。请仔细分析这张图片中的试卷。识别出所有标记为错误的题目（通常有红叉或圈）。将这些错题提取出来，并以JSON数组的格式返回。每个对象应包含 'subject' (例如 '数学', '物理', '语文') 和 'questionText' (完整的题目文本，包括选项)。请忽略图片中的其他内容，只关注错题。如果图片中没有明显的错题，请返回一个空数组。`
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

export async function analyzeKnowledgePoints(questions: Question[]): Promise<string> {
  const model = 'gemini-2.5-flash';
  const promptContent = questions.map(q => `- [${q.subject}] ${q.questionText}`).join('\n');
  
  const prompt = `你是一位资深的教学分析专家。这里有一系列学生做错的高中题目：
${promptContent}

请分析这些题目，总结出背后考察的核心知识点和能力短板。然后，生成一份结构清晰、重点突出的复习提纲，帮助学生有针对性地进行复习。请使用Markdown格式化你的回答，使用标题、列表和粗体来组织内容。`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
  });

  return response.text;
}


export async function generatePracticeTest(analysisResult: string): Promise<PracticeQuestion[]> {
  const model = 'gemini-2.5-pro';
  
  const prompt = `你是一位出题专家。根据以下这份复习提纲，请为一名高中生出一套包含3-5道题目的新练习题，旨在巩固这些薄弱的知识点。为每道题提供详细的步骤和解析。请以JSON数组的格式返回。每个对象应包含 'questionText' (题目) 和 'answerText' (详解答案)。

复习提纲:
${analysisResult}`;

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
