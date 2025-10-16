
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { extractQuestionsFromImage, analyzeKnowledgePoints, generatePracticeTest } from './services/geminiService';
import type { Question, PracticeQuestion, KnowledgePoint, ChatMessage } from './types';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import QuestionList from './components/QuestionList';
import AnalysisDisplay from './components/AnalysisDisplay';
import PracticeTest from './components/PracticeTest';
import Spinner from './components/Spinner';
import TabButton from './components/TabButton';
import ChatModal from './components/ChatModal';
import { BookOpen, Edit, FilePlus, Zap, MessageCircle } from './components/Icons';

type Tab = 'upload' | 'bank' | 'analysis' | 'practice';

const defaultQuestions: Question[] = [
  {
    id: 'default-1',
    subject: '数学',
    questionText: '已知函数 $f(x) = \\sin(\\omega x + \\phi)$ ($\\omega > 0, |\\phi| < \\pi/2$) 的图像相邻两条对称轴之间的距离为 $\\pi/2$，且 $f(\\pi/6) = 1$。求 $f(x)$ 的解析式。',
  },
  {
    id: 'default-2',
    subject: '物理',
    questionText: '一个质量为 2kg 的物体，在水平拉力 F 的作用下，从静止开始沿粗糙水平面做匀加速直线运动。经过 3s，物体的速度达到 6m/s。已知物体与水平面间的动摩擦因数为 0.2，$g=10m/s^2$。求拉力 F 的大小。',
  },
  {
    id: 'default-3',
    subject: '化学',
    questionText: '将 23g 钠投入到 100g 水中，完全反应后，所得溶液的溶质质量分数是多少？（Na=23, H=1, O=16）',
  }
];


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [analysisResult, setAnalysisResult] = useState<KnowledgePoint[]>([]);
  const [practiceTest, setPracticeTest] = useState<PracticeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState('正在处理中...');
  const [error, setError] = useState<string>('');

  // New state for Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatQuestion, setCurrentChatQuestion] = useState<Question | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

  useEffect(() => {
    try {
      const savedBank = localStorage.getItem('questionBank');
      if (savedBank) {
        const parsedBank = JSON.parse(savedBank);
        if (parsedBank.length > 0) {
          setQuestionBank(parsedBank);
          return;
        }
      }
      setQuestionBank(defaultQuestions);
    } catch (e) {
      console.error("Failed to load question bank from localStorage", e);
      setError("无法从本地加载错题库。");
      setQuestionBank(defaultQuestions);
    }
  }, []);

  useEffect(() => {
    const isDefault = questionBank.length === defaultQuestions.length && questionBank.every((q, i) => q.id === defaultQuestions[i].id);
    if (isDefault && !localStorage.getItem('questionBank')) {
        return;
    }

    try {
      localStorage.setItem('questionBank', JSON.stringify(questionBank));
    } catch (e) {
      console.error("Failed to save question bank to localStorage", e);
       setError("无法将错题保存至本地。");
    }
  }, [questionBank]);

  const handleImageUpload = (imageDataUrl: string) => {
    setUploadedImage(imageDataUrl);
    setExtractedQuestions([]);
    setError('');
  };

  const handleExtractQuestions = useCallback(async () => {
    if (!uploadedImage) {
      setError('请先上传一张图片。');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('正在识别题目...');
    setError('');
    try {
      const imageData = uploadedImage.split(',')[1];
      const questions = await extractQuestionsFromImage(imageData);
      setExtractedQuestions(questions);
    } catch (err) {
      console.error(err);
      setError('无法从图片中提取题目，请确保图片清晰并重试。');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage]);

  const handleAddToBank = () => {
    const newQuestions = extractedQuestions.filter(
      (eq) => !questionBank.some((bq) => bq.questionText === eq.questionText)
    );
    if (newQuestions.length > 0) {
        setQuestionBank((prevBank) => [...prevBank, ...newQuestions]);
    }
    setExtractedQuestions([]);
    setUploadedImage(null);
    setActiveTab('bank');
  };

  const handleDeleteFromBank = (id: string) => {
    setQuestionBank((prevBank) => prevBank.filter((q) => q.id !== id));
  };
  
  const handleAnalysis = useCallback(async () => {
    if (questionBank.length === 0) {
        setError("错题库为空，请先添加错题。");
        return;
    }
    setIsLoading(true);
    setLoadingMessage('正在分析知识点...');
    setError('');
    try {
        const result = await analyzeKnowledgePoints(questionBank);
        setAnalysisResult(result);
        setActiveTab('analysis');
    } catch (err) {
        console.error(err);
        setError("生成知识点分析失败，请稍后重试。");
    } finally {
        setIsLoading(false);
    }
  }, [questionBank]);

  const handleGenerateTest = useCallback(async () => {
    if (analysisResult.length === 0) {
        setError("请先进行知识点分析。");
        setActiveTab('analysis');
        return;
    }
    setIsLoading(true);
    setLoadingMessage('正在生成练习题...');
    setError('');
    try {
        const test = await generatePracticeTest(analysisResult);
        setPracticeTest(test);
        setActiveTab('practice');
    } catch (err) {
        console.error(err);
        setError("生成巩固练习失败，请稍后重试。");
    } finally {
        setIsLoading(false);
    }
  }, [analysisResult]);

  // Chat handlers
  const handleOpenChat = useCallback(async (question: Question) => {
    setCurrentChatQuestion(question);
    setIsChatOpen(true);
    setChatHistory([]);
    setIsChatLoading(true);

    try {
      const chat = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
          systemInstruction: '你是一位耐心、知识渊博的高中辅导老师。你的目标是清晰地解释概念，并引导学生找到答案，而不是直接给出答案。请用中文回答。所有数学公式都必须使用LaTeX格式（行内用 $...$ ，块级用 $$...$$）。',
        },
      });
      setChatSession(chat);

      const firstMessage = `你好，这是一道我做错的题，可以请你帮我看看吗？\n\n题目：${question.questionText}`;
      const responseStream = await chat.sendMessageStream({ message: firstMessage });
      
      let fullResponse = "";
      setChatHistory([{ sender: 'ai', text: "" }]);
      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        setChatHistory([{ sender: 'ai', text: fullResponse }]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory([{ sender: 'ai', text: '抱歉，我现在无法开始辅导。请稍后再试。' }]);
    } finally {
      setIsChatLoading(false);
    }
  }, []);
  
  const handleCloseChat = () => {
    setIsChatOpen(false);
    setCurrentChatQuestion(null);
    setChatSession(null);
  };

  const handleSendChatMessage = useCallback(async (message: string) => {
    if (!chatSession) return;
    
    const updatedHistory: ChatMessage[] = [...chatHistory, { sender: 'user', text: message }];
    setChatHistory(updatedHistory);
    setIsChatLoading(true);

    try {
      const responseStream = await chatSession.sendMessageStream({ message });
      
      let fullResponse = "";
      const aiMessageIndex = updatedHistory.length;
      updatedHistory.push({ sender: 'ai', text: "" });
      
      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        updatedHistory[aiMessageIndex] = { sender: 'ai', text: fullResponse };
        setChatHistory([...updatedHistory]);
      }

    } catch (err) {
       console.error(err);
       // FIX: The original code had a logical flaw (using stale `chatHistory`) which also led to a type error.
       // `updatedHistory` correctly contains the user's message for this turn.
       // We append the error message to `updatedHistory` to form the correct final state.
       const finalHistory = [...updatedHistory, { sender: 'ai', text: "抱歉，我好像遇到了一些问题，请稍后再试。" }];
       setChatHistory(finalHistory);
    } finally {
        setIsChatLoading(false);
    }
  }, [chatSession, chatHistory]);


  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="container mx-auto p-4 md:p-8 max-w-5xl">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 border-b border-gray-200 pb-4">
            <TabButton onClick={() => setActiveTab('upload')} isActive={activeTab === 'upload'} icon={<FilePlus />}>上传错题</TabButton>
            <TabButton onClick={() => setActiveTab('bank')} isActive={activeTab === 'bank'} icon={<BookOpen />}>我的错题库</TabButton>
            <TabButton onClick={() => setActiveTab('analysis')} isActive={activeTab === 'analysis'} icon={<Zap />}>知识点分析</TabButton>
            <TabButton onClick={() => setActiveTab('practice')} isActive={activeTab === 'practice'} icon={<Edit />}>巩固练习</TabButton>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
          {isLoading && <Spinner message={loadingMessage} />}
          
          <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-20' : 'opacity-100'}`}>
            {activeTab === 'upload' && (
              <div>
                <FileUpload onImageUpload={handleImageUpload} uploadedImage={uploadedImage} />
                {uploadedImage && (
                    <div className="text-center mt-4">
                        <button onClick={handleExtractQuestions} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-300" disabled={isLoading}>
                            开始识别
                        </button>
                    </div>
                )}
                {extractedQuestions.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">识别出的错题</h2>
                    <QuestionList questions={extractedQuestions} />
                    <div className="text-center mt-4">
                        <button onClick={handleAddToBank} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition duration-300">
                            存入错题库
                        </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'bank' && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">我的错题库 ({questionBank.length})</h2>
                {questionBank.length > 0 ? (
                  <>
                    <QuestionList questions={questionBank} onDelete={handleDeleteFromBank} onStartChat={handleOpenChat} />
                     <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={handleAnalysis} disabled={isLoading} className="bg-sky-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-sky-700 transition duration-300 disabled:bg-sky-300 text-lg flex items-center justify-center gap-2">
                            <Zap /> 分析知识点
                        </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">错题库是空的</h3>
                    <p className="mt-1 text-gray-500">请先从“上传错题”标签页添加题目。</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'analysis' && (
              <div>
                {analysisResult.length > 0 ? (
                    <>
                        <AnalysisDisplay analysis={analysisResult} questions={questionBank} />
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                             <button onClick={handleGenerateTest} disabled={isLoading} className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-emerald-700 transition duration-300 disabled:bg-emerald-300 text-lg flex items-center justify-center gap-2">
                                <Edit /> 生成巩固练习
                            </button>
                        </div>
                    </>
                ) : (
                   <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                    <Zap className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">暂无分析报告</h3>
                    <p className="mt-1 text-gray-500">请先在“我的错题库”中进行知识点分析。</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'practice' && (
              <div>
                {practiceTest.length > 0 ? (
                    <PracticeTest questions={practiceTest} />
                ) : (
                    <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                        <Edit className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">暂无练习题</h3>
                        <p className="mt-1 text-gray-500">请先生成知识点分析，然后创建巩固练习。</p>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <ChatModal 
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        question={currentChatQuestion}
        chatHistory={chatHistory}
        onSendMessage={handleSendChatMessage}
        isLoading={isChatLoading}
      />
    </div>
  );
};

export default App;
